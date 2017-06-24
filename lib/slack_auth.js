var fs = require('fs');
var readline = require('readline');
var prompt = require('prompt-promise');
var Slack = require('slack-api').promisify();

var credentials = require('../slack_credentials.json');

// If modifying these scopes, delete your previously saved credentials
// at ~/.cabdriver/slack-token.json
var SCOPES = [
    'search:read',
    'channels:read',
    'users:read',
];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.cabdriver/';
var TOKEN_PATH = TOKEN_DIR + 'slack-token.json';


exports.getAuth = getAuth;

function getAuth(callback) {
    authorize(credentials, callback);
}

function authorize(credentials, callback) {
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(credentials, callback);
        } else {
            var tokenObj = JSON.parse(token);
            callback(tokenObj.access_token);
        }
    });
}

function getNewToken(options, callback) {
    Slack.oauth.getUrl({
        client_id: options.client_id,
        scope: SCOPES.join(',')
    })
    .then(function(data) {
        console.log('Authorize this app by visiting this url: ', data);
        return prompt('Enter the code from that page here: ');
    }).then(function(code) {
        return Slack.oauth.access({
            'client_id': options.client_id,
            'client_secret': options.client_secret,
            'code': code
        });
    }).then(function(data) {
      storeToken(data);
      callback(data.access_token);
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
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}
