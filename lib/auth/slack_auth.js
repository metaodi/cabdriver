"use strict";

var fs = require('fs');
var prompt = require('prompt-promise');
var Slack = require('slack-api').promisify();

var credentials = require('../../slack_credentials.json');

var Auth = require('./auth');

// If modifying these scopes, delete your previously saved credentials
// at ~/.cabdriver/slack-token.json
var SCOPES = [
    'search:read',
    'channels:read',
    'users:read',
];

class SlackAuth extends Auth {
    constructor() {
        super();
        this.clientId = credentials.client_id;
        this.clientSecret = credentials.client_secret;
    }

    getTokenFilename() {
        return 'slack-token.json';
    }

    mapToken(obj) {
        return obj.access_token;
    }

    getNewToken() {
        var me = this;
        return Slack.oauth.getUrl({
            client_id: me.clientId,
            scope: SCOPES.join(',')
        })
        .then(function(data) {
            console.log('Authorize this app by visiting this url: ', data);
            return prompt('Enter the code from that page here: ');
        })
        .then(function(code) {
            return Slack.oauth.access({
                'client_id': me.clientId,
                'client_secret': me.clientSecret,
                'code': code
            });
        })
        .then(function(data) {
            me.storeToken(data);
            return me.mapToken(data);
        })
        .catch(function(err) {
            throw new Error('Error while trying to retrieve access token: ' +err);
        });
    }
}

module.exports = SlackAuth;
