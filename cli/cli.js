'use strict';

var _ = require('lodash');
var Yaml = require('js-yaml');
var fs = require('fs');
var path = require('path')
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
        var config;
        try {
            config = Yaml.safeLoad(fs.readFileSync(configPath, 'utf8'));
            if (!_.has(config, 'defaults')) {
                console.error('Config file has no \'defaults\' key');
                throw 'malformated config';
            }
        } catch (e) {
            config = {'defaults': {}};
        }
        return config;
    }

    getCabdriverPath() {
        var baseDir = '';
        if (process.env.HOME) {
            baseDir = process.env.HOME;
        } else if (process.env.HOMEDRIVE && process.env.HOMEPATH) {
            baseDir = path.join(process.env.HOMEDRIVE, process.env.HOMEPATH);
        } else if (process.env.USERPROFILE) {
            baseDir = process.env.USERPROFILE;
        }
        if (!baseDir) {
            console.error('Unable to find home directory (check env variables HOME, HOMEDRIVE, HOMEPATH and USERPROFILE)');
            throw 'home directory not found';
        }

        return path.join(baseDir, '.cabdriver');
    }

    getConfigPath() {
        var me = this;
        var cabdriverDir = me.getCabdriverPath();
        return cabdriverDir + 'cabdriver.yml';
    }

    getCacheBase() {
        var me = this;
        var cabdriverDir = me.getCabdriverPath();

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
