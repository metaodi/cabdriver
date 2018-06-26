"use strict";

var Promise = require('bluebird');

var Auth = require('./auth');

class NullAuth extends Auth {
    constructor(value) {
        super();
        this.value = value || null;
    }

    getTokenFilename() {
        return '';
    }

    getAuth() {
        var me = this;
        return Promise.resolve(me.value);
    }
}

module.exports = NullAuth;
