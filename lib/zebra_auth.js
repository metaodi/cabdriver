var fs = require('fs');
var prompt = require('prompt-promise');

var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.cabdriver/';
var TOKEN_PATH = TOKEN_DIR + 'zebra-token.json';


exports.getAuth = getAuth;

function getAuth(callback) {
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(callback);
        } else {
            var tokenObj = JSON.parse(token);
            callback(tokenObj.token);
        }
    });
}

function getNewToken(callback) {
    prompt('Enter your Zebra API Token: ')
      .then(function(token) {
        var tokenObj = {'token': token};
        storeToken(tokenObj);
        callback(token);
      })
      .catch(function(err) {
          console.log('Error while trying to get or store token', err);
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
