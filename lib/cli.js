var Async = require('async');
var Yaml = require('js-yaml');
var Moment = require('moment-timezone');
var Pad = require('pad');
var _ = require('lodash');

var fs = require('fs');

var google_auth = require('./google_auth');
var slack_auth = require('./slack_auth');
var jira_auth = require('./jira_auth');
var zebra_auth = require('./zebra_auth');
var github_auth = require('./github_auth');
var calendar = require('./calendar');
var mail = require('./mail');
var slack = require('./slack');
var logbot = require('./logbot');
var jira = require('./jira');
var zebra = require('./zebra');
var git = require('./git');
var github = require('./github');
var date = require('./date');
var util = require('./util');

exports.run = run;
exports.querySources = querySources;
exports.printResults = printResults;
exports.groupByAndSort = groupByAndSort;
exports.loadConfig = loadConfig;
exports.getOptions = getOptions;

function run(program) {
    //load config
    var configDir = (process.env.HOME || process.env.HOMEPATH ||
                     process.env.USERPROFILE) + '/.cabdriver/';
    var config = loadConfig(configDir);
    var options = getOptions(program, config);

    querySources(options, function(err, results) {
        if (err) {
            console.error("Error occured: ", err);
            return;
        }
        printResults(results);
        process.exit(0);
    });
}

function querySources(options, exitCallback) {
    Async.parallel([
        function(callback) {
            // Google Calendar
            if (options.calendar) {
                google_auth.getAuth(function(auth) {
                    if (_.isBoolean(options.calendar)) {
                        options.calendar = 'primary';
                    }
                    calendar.listEvents(callback, auth, options);
                });
            } else {
                callback(null, []);
            }
        },
        function(callback) {
            // Google Mail
            if (options.mail) {
                google_auth.getAuth(function(auth) {
                    mail.listMessages(callback, auth, options);
                });
            } else {
                callback(null, []);
            }
        },
        function(callback) {
            if (options.slack) {
                slack_auth.getAuth(function(auth) {
                    slack.dailyStats(callback, auth, options);
                });
            } else {
                callback(null, []);
            }
        },
        function(callback) {
            if (options.logbot) {
                slack_auth.getAuth(function(auth) {
                    logbot.getLogs(callback, auth, options);
                });
            } else {
                callback(null, []);
            }
        },
        function(callback) {
            if (options.jira) {
                jira_auth.getAuth(function(auth) {
                    jira.getActivities(callback, auth, options);
                });
            } else {
                callback(null, []);
            }
        },
        function(callback) {
            if (options.zebra) {
                zebra_auth.getAuth(function(auth) {
                    zebra.getTimesheets(callback, auth, options);
                });
            } else {
                callback(null, []);
            }
        },
        function(callback) {
            if (options.git) {
                git.getCommits(callback, options);
            } else {
                callback(null, []);
            }
        },
        function(callback) {
            if (options.github) {
                github_auth.getAuth(function(auth) {
                    github.getContributions(callback, auth, options);
                });
            } else {
                callback(null, []);
            }
        }
    ],
    function(err, results) {
        results = _.flatten(results);
        exitCallback(err, results);
    });
}

function loadConfig(configDir) {
    var config;
    try {
        var path = configDir + 'cabdriver.yml';
        config = Yaml.safeLoad(fs.readFileSync(path, 'utf8'));
        if (!_.has(config, 'defaults')) {
            console.error("Config file has no 'defaults' key");
            throw "malformated config";
        }
    } catch (e) {
        config = {'defaults': {}};
    }
    return config;
}

function getOptions(program, config) {
    var options = {};
    var sourceKeys = ['calendar', 'mail', 'slack', 'logbot', 'jira', 'zebra', 'git', 'github'];

    var calledWithoutSources = _.every(program.opts(), function(value, key) {
        return sourceKeys.indexOf(key) < 0 || !value;
    });
    if (calledWithoutSources) {
        _.assignIn(options, program.opts(), config.defaults);
    } else {
        _.assignIn(options, config.defaults, program.opts());
    }

    var noSourcesInOptions = _.every(options, function(value, key) {
        return sourceKeys.indexOf(key) < 0 || !value;
    });

    if (noSourcesInOptions) {
        options.calendar = true;
    }

    var dates = date.getStartAndEndDate(options.date);

    Moment.suppressDeprecationWarnings = true;
    if (!Moment(dates['endDate']).isValid() || !Moment(dates['startDate']).isValid()) {
        console.error("Please enter a valid date range");
        process.exit(1);
    } else {
        options['startDate'] = dates['startDate'];
        options['endDate'] = dates['endDate'];
    }

    if (options.verbose) {
        console.log('Start date: %s', Moment.tz(options['startDate'], 'Europe/Zurich').format('DD.MM.YYYY'));
        console.log('End date: %s', Moment.tz(options['endDate'], 'Europe/Zurich').format('DD.MM.YYYY'));
        console.log('Calendar: %s', options.calendar);
        console.log('Mail: %s', options.mail);
        console.log('Slack: %s', options.slack);
        console.log('Logbot: %s', options.logbot);
        console.log('Jira: %s', options.jira);
        console.log('Zebra: %s', options.zebra);
        console.log('Git: %s', options.git);
        console.log('Pie chart: %s', options.pie);
        console.log('Hours: %s', options.hours);
        console.log('Count: %s', options.number);
    }

    return options;
}

function groupByAndSort(results) {
    //group by and order the result object based on timestamp
    results = _.groupBy(results, 'timestamp');
    var orderedResults = {};
    Object.keys(results).sort().forEach(function(key) {
          orderedResults[key] = results[key];
    });
    return orderedResults;
}

function printResults(results) {
    var orderedResults = groupByAndSort(results);

    //print a section for each day separated by type
    _.each(orderedResults, function(msgs, timestamp) {
        var day = Moment.unix(timestamp).tz('Europe/Zurich');

        var allProjects = _.keys(_.groupBy(msgs, 'project'));
        var maxProjectLength = allProjects.reduce(function (a, b) { return a.length > b.length ? a : b; }).length;
        var projectPadding = Math.max(5, maxProjectLength + 1);

        var allTimes = _.keys(_.groupBy(msgs, 'time'));
        var maxTimeLength = allTimes.reduce(function (a, b) { return a.length > b.length ? a : b; }).length;
        var timePadding = Math.max(2, maxTimeLength + 1);

        msgs = _.groupBy(msgs, 'type');
        console.log('');
        console.log('');
        console.log('%s # %s', day.format('DD/MM/YYYY'), day.format('dddd'));
        _.each(msgs, function(msgs, type) {
            var total = _.reduce(msgs, function(sum, msg) {
               var time = util.filterFloat(msg.time);
               if (_.isNaN(time)) {
                   time = date.parseTimeRange(msg.time);
               }
               return sum + (_.isNaN(time) ? 0 : time);
            }, 0);
            total = total.toFixed(2);
            console.log('');
            process.stdout.write('# ' + type);
            if (total > 0) {
                process.stdout.write(' (Total: ' + total + 'h)');
            }
            process.stdout.write('\n');

            console.log('#------------------');
            _.each(msgs, function(msg) {
                if (_.has(msg, 'raw') && msg.raw) {
                    console.log(msg.raw);
                } else {
                    var text = Pad(msg.project, projectPadding);
                    if (msg.time) {
                        text += Pad(msg.time, timePadding);
                    }
                    text += msg.text;
                    if (msg.comment) {
                        text = '# ' + text;
                    }
                    console.log(text);
                }
            });
        });
    });
}
