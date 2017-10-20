"use strict";

var _ = require('lodash');
var Yaml = require('js-yaml');
var fs = require('fs');

class Cli {
    constructor(programOpts) {
        this.programOpts = programOpts;
        this.config = this.loadConfig();
        this.options = this.getOptions();
        this.options.cmdName = this.getCmdName();
        if (this.options.test) {
            console.log(JSON.stringify(this.options));
            process.exit(0);
        }
    }

    getCmdName() {
        return null;
    }

    loadConfig(configPath) {
        var me = this;
        configPath = configPath || me.getConfigPath();

        var config;
        try {
            config = Yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
            if (!_.has(config, 'defaults')) {
                console.error("Config file has no 'defaults' key");
                throw "malformated config";
            }
        } catch (e) {
            config = {'defaults': {}};
        }
        return config;
    }

    getConfigPath() {
        var configDir = (process.env.HOME || process.env.HOMEPATH ||
                     process.env.USERPROFILE) + '/.cabdriver/';
        return configDir + 'cabdriver.yml';
    }

    getOptions() {
        var me = this;
        var options = {};

        _.assignIn(options, me.config.defaults, me.programOpts);

        return options;
    }
}

module.exports = Cli;
