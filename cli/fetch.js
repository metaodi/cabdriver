"use strict";

var Async = require('async');
var Moment = require('moment-timezone');
var Pad = require('pad');
var _ = require('lodash');

var fs = require('fs');

var GoogleAuth = require('../lib/auth/google_auth');
var SlackAuth = require('../lib/auth/slack_auth');
var JiraAuth = require('../lib/auth/jira_auth');
var ZebraAuth = require('../lib/auth/zebra_auth');
var GithubAuth = require('../lib/auth/github_auth');
var GitlabAuth = require('../lib/auth/gitlab_auth');
var NullAuth = require('../lib/auth/null_auth');
var GoogleCalendar = require('../lib/calendar');
var GoogleMail = require('../lib/mail');
var Slack = require('../lib/slack');
var Logbot = require('../lib/logbot');
var Jira = require('../lib/jira');
var Zebra = require('../lib/zebra');
var Git = require('../lib/git');
var Github = require('../lib/github');
var Gitlab = require('../lib/gitlab');
var date = require('../lib/date');
var util = require('../lib/util');

var Cli = require('./cli');

class FetchCli extends Cli {
    constructor(programOpts, configPath, sources) {
        super(programOpts, configPath);
        this.sources = sources || {
            calendar: { source: GoogleCalendar, auth: GoogleAuth },
            mail: { source: GoogleMail, auth: GoogleAuth },
            git: { source: Git, auth: NullAuth },
            gitlab: { source: Gitlab, auth: GitlabAuth },
            github: { source: Github, auth: GithubAuth },
            jira: { source: Jira, auth: JiraAuth },
            slack: { source: Slack, auth: SlackAuth },
            logbot: { source: Logbot, auth: SlackAuth },
            zebra: { source: Zebra, auth: ZebraAuth }
        };
        this.updateOptions(this.options);
    }

    run() {
        super.run();
        var me = this;

        me.querySources(function(err, results) {
            if (err) {
                console.error("Error occured: ", err);
                return;
            }
            try {
                results = me.postProcess(results);
                me.printResults(results);
                process.exit(0);
            } catch (e) {
                console.error("Error occured: ", e);
                process.exit(1);
            }
        });
    }

    postProcess(results) {
        var me = this;

        // map results to user-defined projects
        results = _.map(results, function(msg) {
            return me.mapProjects(msg);
        });

        // remove `null` entries
        results = _.filter(results, function(msg) {
            return !_.isNull(msg);
        });
        return results;
    }

    mapProjects(msg) {
        var me = this;
        var mapping = me.getMapping();

        if (!mapping) {
            return msg;
        }

        _.forEach(mapping, function(patterns, key) {
            var projectMatch = _.some(patterns, function(pattern) {
                var re = new RegExp(pattern, 'i');
                return re.test(msg.project) || re.test(msg.text);
            });
            if (projectMatch && ['__comment__', '__remove__'].indexOf(key) === -1) {
                msg.project = key;
                return false;
            }
        });
        if (mapping['__comment__']) {
            var commentMatch = _.some(mapping['__comment__'], function(pattern) {
                var re = new RegExp(pattern, 'i');
                return re.test(msg.project) || re.test(msg.text);
            });
            if (commentMatch) {
                msg.comment = true;
            }
        }
        if (mapping['__remove__']) {
            var removeMatch = _.some(mapping['__remove__'], function(pattern) {
                var re = new RegExp(pattern, 'i');
                return re.test(msg.project) || re.test(msg.text);
            });
            if (removeMatch && me.options.verbose) {
                msg.comment = true;
                msg.text = msg.text + ' [REMOVED]';
            } else if (removeMatch) {
                msg = null;
            }
        }
        return msg;
    }

    getMapping() {
        var me = this;

        if (this.config.mapping) {
            return me.config.mapping;
        }
        return {};
    }


    getCmdName() {
        return 'fetch';
    }

    querySources(exitCallback) {
        var me = this;

        var sources = me.getSources();
        var sourceEntries = _.mapValues(
            sources,
            function(source) {
                return function(callback) {
                    source.getEntries()
                        .then(function(entries) {
                            callback(null, entries);
                        })
                        .catch(callback);
                };
            }
       );

        Async.parallel(
            Async.reflectAll(sourceEntries),
            function(err, allResults) {
                var results = [];
                _.each(allResults, function(result, key) {
                    if (result.value) {
                        results = results.concat(result.value);
                    } else {
                        console.error('');
                        console.error(key + ' source failed: ' + result.error);
                    }
                });
                exitCallback(null, results);
        });
    }

    getSources() {
        var me = this;
        var sources = _.mapValues(me.sources, function(config) {
            return new config.source(me.options, new config.auth());
        });

        return sources;
    }

    updateOptions(options) {
        var me = this;
        options = options || {};

        var calledWithSources = me.sourcesInOptions(me.programOpts);
        if (calledWithSources) {
            _.assignIn(options, me.config.defaults, me.programOpts);
        } else {
            _.assignIn(options, me.programOpts, me.config.defaults);
        }

        var sourcesInOptions = me.sourcesInOptions(options);
        if (!sourcesInOptions) {
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
            console.log('Github: %s', options.github);
            console.log('Gitlab: %s', options.gitlab);
            console.log('Pie chart: %s', options.pie);
            console.log('Hours: %s', options.hours);
            console.log('Count: %s', options.number);
            console.log('Config: %s', options.config);
        }

        return options;
    }

    sourcesInOptions(opts) {
        var me = this;
        var sourceKeys = _.keys(me.sources);
        return _.some(opts, function(value, key) {
            return sourceKeys.indexOf(key) >= 0 && value;
        });
    }


    printResults(results) {
        var me = this;
        var orderedResults = me.groupByAndSort(results);

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

    groupByAndSort(results) {
        //group by and order the result object based on timestamp
        results = _.groupBy(results, 'timestamp');
        var orderedResults = {};
        Object.keys(results).sort().forEach(function(key) {
              orderedResults[key] = results[key];
        });
        return orderedResults;
    }
}

module.exports = FetchCli;
