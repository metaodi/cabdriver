var Async = require('async');
var Moment = require('moment-timezone');
var Pad = require('pad');
var _ = require('lodash');

var fs = require('fs');

var GoogleAuth = require('../lib/google_auth');
var SlackAuth = require('../lib/slack_auth');
var JiraAuth = require('../lib/jira_auth');
var ZebraAuth = require('../lib/zebra_auth');
var GithubAuth = require('../lib/github_auth');
var GitlabAuth = require('../lib/gitlab_auth');
var NullAuth = require('../lib/null_auth');
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
    constructor(programOpts, sources) {
        super(programOpts);
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
    }

    run() {
        var me = this;

        me.querySources(function(err, results) {
            if (err) {
                console.error("Error occured: ", err);
                return;
            }
            me.printResults(results);
            process.exit(0);
        });
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

    getOptions() {
        var me = this;
        var options = {};
        var sourceKeys = _.keys(me.sources);

        var calledWithoutSources = _.every(me.programOpts, function(value, key) {
            return sourceKeys.indexOf(key) < 0 || !value;
        });
        if (calledWithoutSources) {
            _.assignIn(options, me.programOpts, me.config.defaults);
        } else {
            _.assignIn(options, me.config.defaults, me.programOpts);
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
            console.log('Github: %s', options.github);
            console.log('Gitlab: %s', options.gitlab);
            console.log('Pie chart: %s', options.pie);
            console.log('Hours: %s', options.hours);
            console.log('Count: %s', options.number);
        }

        return options;
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
