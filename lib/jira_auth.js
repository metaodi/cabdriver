// this code follows the oauth example of atlassian
// https://bitbucket.org/atlassian_tutorial/atlassian-oauth-examples
// implementation is based on https://gist.github.com/attrib/ea446d5cd25617cf14a2

var fs = require('fs');
var readline = require('readline');
var prompt = require('prompt-promise');
var Promise = require('bluebird');
var OAuth = Promise.promisifyAll(require('oauth'), {multiArgs: true}).OAuth;

var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.cabdriver/';
var TOKEN_PATH = TOKEN_DIR + 'jira-token.json';

// To generate a new key pair, the following commands were used (based on https://www.madboa.com/geek/openssl/#key-rsa)
// openssl genrsa -out jira-rsa-key.pem 2048 # generate a new key
// openssl rsa -in jira-rsa-key.pem -pubout # print public key
var privateKeyData = fs.readFileSync(__dirname + '/../jira-rsa-key.pem', "utf8");
var credentials = require('../jira_credentials.json');

exports.getAuth = getAuth;

function getAuth(callback) {
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            var options = Object.assign(credentials, {'host': 'https://jira.liip.ch'});
            getNewToken(options, callback);
        } else {
            var tokenObj = JSON.parse(token);
            var auth = {
                'access_token': tokenObj.access_token,
                'access_token_secret': tokenObj.access_token_secret,
                'consumer_key': credentials.consumer_key,
                'consumer_secret': privateKeyData
            };
            callback(auth);
        }
    });
}

function getNewToken(options, callback) {
    var consumer = new OAuth(
        options.host + "/plugins/servlet/oauth/request-token",
        options.host + "/plugins/servlet/oauth/access-token",
        options.consumer_key,
        privateKeyData,
        "1.0",
        "https://cabdriver.herokuapp.com/jira",
        "RSA-SHA1",
        null,
        {
            "Accept" : "application/json",
            "Connection" : "close",
            "User-Agent" : "Node authentication",
            "Content-Type" : "application/json" 
        }
    );
    var requestToken = null;
    var requestTokenSecret = null;
    consumer.getOAuthRequestTokenAsync()
        .then(function (results) {
            requestToken = results[0];
            requestTokenSecret = results[1];
            var auth_url = options.host + '/plugins/servlet/oauth/authorize?oauth_token=' + requestToken;
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
            storeToken(token);
            token['consumer_key'] = credentials.consumer_key;
            token['consumer_secret'] = privateKeyData;
            callback(token);
        })
        .catch(function(err) {
            console.log('Error while trying to retrieve access token', err);
        });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}
