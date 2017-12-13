"use strict";

var _ = require('lodash');
var Yaml = require('js-yaml');
var fs = require('fs');
var Cache = require('persistent-cache');

class Cli {
    constructor(programOpts, configPath) {
        this.programOpts = programOpts;
        configPath = configPath || this.getConfigPath();
        if (programOpts && programOpts['config']) {
            configPath = programOpts['config'];
        }
        this.config = this.loadConfig(configPath);
        this.options = this.getOptions();
        this.options.cmdName = this.getCmdName();
        this.options.cache = Cache({
            base: this.getCacheBase(),
            name: 'cache',
            duration: 1000 * 3600 * this.getCacheHours()
        });
    }

    run() {
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

    getCacheBase() {
        var me = this;
        var cabdriverDir = (process.env.HOME || process.env.HOMEPATH ||
                     process.env.USERPROFILE) + '/.cabdriver/';

        if (me.config.cache && me.config.cache.path) {
            return me.config.cache.path;
        }

        return cabdriverDir;
    }

    getCacheHours() {
        var me = this;

        if (me.config.cache && me.config.cache.hours) {
            return me.config.cache.hours;
        }
        return 1;
    }

    getOptions() {
        var me = this;
        var options = {};

        _.assignIn(options, me.config.defaults, me.programOpts);

        return options;
    }
}

module.exports = Cli;
