"use strict";

var prompt = require('prompt-promise');
var Request = require('superagent');

var credentials = require('../../github_credentials.json');

var Auth = require('./auth');

// If modifying these scopes, delete your previously saved credentials
// at ~/.cabdriver/github-token.json
var SCOPES = [
    'repo',
];

class GithubAuth extends Auth {
    constructor() {
        super();
        this.clientId = credentials.client_id;
        this.clientSecret = credentials.client_secret;
    }

    getTokenFilename() {
        return 'github-token.json';
    }

    mapToken(obj) {
        return obj.access_token;
    }

    getNewToken() {
        var me = this;
        var url = 'http://github.com/login/oauth/authorize?';
        url += 'client_id=' + me.clientId + '&';
        url += 'scope=' + SCOPES.join(' ');
        console.log('Authorize this app by visiting this url: ', url);
        return prompt('Enter the code from that page here: ')
            .then(function(code) {
                return Request
                    .post('https://github.com/login/oauth/access_token')
                    .accept('application/json')
                    .send({'client_id': me.clientId})
                    .send({'client_secret': me.clientSecret})
                    .send({'code': code});
            }).then(function(response) {
              me.storeToken(response.body);
              return me.mapToken(response.body);
            })
            .catch(function(err) {
                throw new Error('Error while getting github access token: ' +  err);
            });
    }
}

module.exports = GithubAuth;
