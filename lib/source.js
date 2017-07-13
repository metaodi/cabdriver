"use strict";

var Promise = require('bluebird');

class Source {
    constructor(options, auth) {
        this.options = options;
        this.auth = auth;
        this.type = 'abstractsource';
    }

    getEntries() {
        var me = this;
        if (!me.isActiveSource()) {
            return Promise.resolve([]);
        }
        return me.auth.getAuth()
            .then(function(auth) {
                return me.generateEntries(auth);
            });
    }

    isActiveSource() {
        var me = this;
        return (me.options[me.type] ? true : false);
    }
    
    generateEntries(auth) {
        throw new Error("not implemented");
    }
    
}

module.exports = Source; 
