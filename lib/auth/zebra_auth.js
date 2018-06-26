"use strict";

var fs = require('fs');
var prompt = require('prompt-promise');

var Auth = require('./auth');

class ZebraAuth extends Auth {
    getTokenFilename() {
        return 'zebra-token.json';
    }

    mapToken(obj) {
        return obj.token;
    }

    getNewToken() {
        var me = this;
        prompt('Enter your Zebra API Token: ')
            .then(function(token) {
                var tokenObj = {'token': token};
                me.storeToken(tokenObj);
                return me.mapToken(tokenObj);
            })
            .catch(function(err) {
                throw new Error('Error while trying to get or store zebra token: ' + err);
            });
    }
}

module.exports = ZebraAuth;
