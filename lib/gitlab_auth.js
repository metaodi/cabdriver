var fs = require('fs');
var readline = require('readline');
var prompt = require('prompt-promise');
var Request = require('superagent');

var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.cabdriver/';
var TOKEN_PATH = TOKEN_DIR + 'gitlab-token.json';

exports.getAuth = getAuth;

function getAuth(callback) {
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(callback);
        } else {
            var tokenObj = JSON.parse(token);
            callback(tokenObj.personal_access_token);
        }
    });
}




function getNewToken(callback) {
    var url = 'https://gitlab.liip.ch/profile/personal_access_tokens';
    console.log("Create a new personal access token in GitLab (make sure it has the 'api' scope!): ", url);
    prompt('Paste the token here: ')
    .then(function(token) {
      storeToken({'personal_access_token': token});
      callback(token);
    })
    .catch(function(err) {
        console.log('Error while trying to save the personal access token: ', err);
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
