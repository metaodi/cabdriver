var fs = require('fs');
var readline = require('readline');
var prompt = require('prompt-promise');
var Request = require('superagent');

var credentials = require('../github_credentials.json');

// If modifying these scopes, delete your previously saved credentials
// at ~/.cabdriver/github-token.json
var SCOPES = [
    'repo',
];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.cabdriver/';
var TOKEN_PATH = TOKEN_DIR + 'github-token.json';


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
    var url = 'http://github.com/login/oauth/authorize?';
    url += 'client_id=' + options.client_id + '&';
    url += 'scope=' + SCOPES.join(' ');
    console.log('Authorize this app by visiting this url: ', url);
    prompt('Enter the code from that page here: ')
    .then(function(code) {
        return Request
            .post('https://github.com/login/oauth/access_token')
            .accept('application/json')
            .send({'client_id': options.client_id})
            .send({'client_secret': options.client_secret})
            .send({'code': code});
    }).then(function(response) {
      storeToken(response.body);
      callback(response.body.access_token);
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
