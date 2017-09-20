var _ = require('lodash');
var fs = require('fs');

class Cli {
    constructor(programOpts) {
        this.programOpts = programOpts;
        this.configPath = this.getConfigPath();
        this.config = this.loadConfig();
        this.options = this.getOptions();
    }

    loadConfig() {
        var me = this;
        var config;
        try {
            config = Yaml.safeLoad(fs.readFileSync(me.configPath, 'utf8'));
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

        if (options.test) {
            console.dir(options);
            process.exit(0);
        }

        return options;
    }
}

module.exports = Cli;
