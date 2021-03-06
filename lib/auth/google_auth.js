'use strict';

var gal = require('google-auth-library');
var prompt = require('prompt-promise');

var client_secret = require('../../client_secret.json');

var Auth = require('./auth');

// If modifying these scopes, delete your previously saved credentials
// at ~/.cabdriver/calendar-nodejs-token.json
var SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly'
];

class GoogleAuth extends Auth {
    constructor() {
        super();
        this.clientSecret = client_secret.installed.client_secret;
        this.clientId = client_secret.installed.client_id;
        this.redirectUrl = client_secret.installed.redirect_uris[0];
    }

    getTokenFilename() {
        return 'google-token.json';
    }

    getAuth() {
        var me = this;
        var oauth2Client = new gal.OAuth2Client(me.clientId, me.clientSecret, me.redirectUrl);

        return me.readToken()
            .then(function(token) {
                oauth2Client.setCredentials(token);
                return oauth2Client;
            })
            .catch(function(err) {
                return me.getNewToken(oauth2Client);
            });
    }

    getNewToken(oauth2Client) {
        var me = this;
        var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
        console.log('Authorize this app by visiting this url: ', authUrl);
        return prompt('Enter the code from that page here: ')
            .then(function(code) {
                return oauth2Client.getToken(code);
            })
            .then(function(r) {
                oauth2Client.setCredentials(r.tokens);
                me.storeToken(r.tokens);
                return oauth2Client;
            })
            .catch(function(err) {
                console.log('Error while trying to retrieve access token', err);
                throw err;
            });
    }
}

module.exports = GoogleAuth;
