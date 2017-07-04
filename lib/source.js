var Promise = require('bluebird');

class Source {
    constructor(options) {
        this.type = 'abstractsource';
        this.options = options;
    }

    getEntries() {
        var me = this;
        if (!me.isActiveSource()) {
            return Promise.resolve([]);
        }
        return me.getAuth()
            .then(function(auth) {
                return me.generateEntries(auth);
            });
    }

    isActiveSource() {
        var me = this;
        return (me.options[me.type] ? true : false);
    }
    
    getAuth() {
        throw new Error("not implemented");
    }

    generateEntries(auth) {
        throw new Error("not implemented");
    }
    
}

module.exports = Source; 
