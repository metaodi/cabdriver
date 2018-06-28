"use strict";

var fs = require('fs-extra');

class Auth {
    constructor() {
        this.tokenFilename = this.getTokenFilename();
        this.tokenDir = (process.env.HOME || process.env.HOMEPATH ||
            process.env.USERPROFILE) + '/.cabdriver/';
        this.tokenPath = this.tokenDir + this.tokenFilename;
    }

    getTokenFilename() {
        throw new Error("not implemented");
    }

    getAuth() {
        var me = this;
        return me.readToken();
    }

    readToken() {
        var me = this;
        return fs.readJson(me.tokenPath)
            .then(function(tokenObj) {
                return me.mapToken(tokenObj);
            })
            .catch(function(err) {
                return me.getNewToken();
            });
    }

    mapToken(obj) {
        return obj;
    }

    storeToken(token) {
        var me = this;
        try {
            fs.mkdirSync(me.tokenDir);
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }
        fs.writeJsonSync(me.tokenPath, token);
        console.log('Token stored to ' + me.tokenPath);
    }
}

module.exports = Auth;
