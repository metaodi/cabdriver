'use strict';

// this code follows the oauth example of atlassian
// https://bitbucket.org/atlassian_tutorial/atlassian-oauth-examples
// implementation is based on https://gist.github.com/attrib/ea446d5cd25617cf14a2

var fs = require('fs');
var prompt = require('prompt-promise');
var Promise = require('bluebird');
var OAuth = Promise.promisifyAll(require('oauth'), {multiArgs: true}).OAuth;

var Auth = require('./auth');

// To generate a new key pair, the following commands were used (based on https://www.madboa.com/geek/openssl/#key-rsa)
// openssl genrsa -out jira-rsa-key.pem 2048 # generate a new key
// openssl rsa -in jira-rsa-key.pem -pubout # print public key
var privateKeyData = fs.readFileSync(__dirname + '/../../jira-rsa-key.pem', 'utf8');
var credentials = require('../../jira_credentials.json');

class JiraAuth extends Auth {
    constructor() {
        super();
        this.consumerKey = credentials.consumer_key;
        this.host = 'https://jira.liip.ch';
        this.privateKey = privateKeyData;
    }

    getTokenFilename() {
        return 'jira-token.json';
    }

    mapToken(obj) {
        var me = this;
        var auth = {
            'access_token': obj.access_token,
            'access_token_secret': obj.access_token_secret,
            'consumer_key': me.consumerKey,
            'consumer_secret': me.privateKey
        };
        return auth;
    }

    // eslint-disable-next-line max-lines-per-function
    getNewToken() {
        var me = this;
        var consumer = new OAuth(
            me.host + '/plugins/servlet/oauth/request-token',
            me.host + '/plugins/servlet/oauth/access-token',
            me.consumerKey,
            me.privateKey,
            '1.0',
            'https://cabdriver.herokuapp.com/jira',
            'RSA-SHA1',
            null,
            {
                'Accept' : 'application/json',
                'Connection' : 'close',
                'User-Agent' : 'Node authentication',
                'Content-Type' : 'application/json' 
            }
        );
        var requestToken = null;
        var requestTokenSecret = null;
        return consumer.getOAuthRequestTokenAsync()
            .then(function (results) {
                requestToken = results[0];
                requestTokenSecret = results[1];
                var auth_url = me.host + '/plugins/servlet/oauth/authorize?oauth_token=' + requestToken;
                console.log('Authorize this app by visiting this url: ', auth_url);
                return prompt('Enter the code from that page here: ');
            })
            .then(function(oauthVerifier) {
                oauthVerifier = oauthVerifier.trim();
                return consumer.getOAuthAccessTokenAsync(requestToken, requestTokenSecret, oauthVerifier);
            })
            .then(function(results) {
                var token = {
                    'access_token': results[0],
                    'access_token_secret': results[1],
                };
                me.storeToken(token);
                return me.mapToken(token);
            })
            .catch(function(err) {
                throw new Error('Error while trying to retrieve access token: ' + err);
            });
    }
}

module.exports = JiraAuth;
