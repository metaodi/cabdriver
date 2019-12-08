'use strict';

var prompt = require('prompt-promise');

var Auth = require('./auth');

class GitlabAuth extends Auth {
    getTokenFilename() {
        return 'gitlab-token.json';
    }

    mapToken(obj) {
        return obj.personal_access_token;
    }

    getNewToken() {
        var me = this;
        var url = 'https://gitlab.liip.ch/profile/personal_access_tokens';
        console.log('Create a new personal access token in GitLab (make sure it has the \'api\' scope!): ', url);
        return prompt('Paste the token here: ')
            .then(function(token) {
                me.storeToken({'personal_access_token': token});
                return token;
            })
            .catch(function(err) {
                console.log('Error while trying to save the personal access token: ', err);
                throw err;
            });
    }

}

module.exports = GitlabAuth;
