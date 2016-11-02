#!/usr/bin/env node

var Program = require('commander');
var SemanticDate = require('semantic-date');
var Moment = require('moment-timezone');
var Async = require('async');
var Pad = require('pad');
var _ = require('underscore');

var auth = require('./lib/auth');
var slack_auth = require('./lib/slack_auth');
var jira_auth = require('./lib/jira_auth');
var calendar = require('./lib/calendar');
var mail = require('./lib/mail');
var slack = require('./lib/slack');
var jira = require('./lib/jira');
var git = require('./lib/git');
var pkg = require('./package.json');

exports.getStartAndEndDate = getStartAndEndDate;

function dashed(val) {
    var splitted = val.split('-');
    return _.map(splitted, function(elem) {
        return elem.trim();
    });
}

function getStartAndEndDate(dateStr) {
    var dates = {
        'startDate': null,
        'endDate': null
    };
    if (SemanticDate.validate(dateStr)) {
        var parsed = SemanticDate.convert(dateStr);
        dates['startDate'] = Moment.tz(parsed.start, 'Europe/Zurich');
        dates['endDate'] = Moment.tz(parsed.end, 'Europe/Zurich');
    } else {
        var dateArr = dashed(dateStr);
        var startStr = dateArr[0];
        var endStr = '';
        if (dateArr.length > 1) {
            endStr = dateArr[1];
        }

        if (startStr && Moment(startStr, 'DD.MM.YYYY').isValid()) {
            dates['startDate'] = Moment.tz(startStr, 'DD.MM.YYYY', 'Europe/Zurich');
        }
        if (endStr && Moment(endStr, 'DD.MM.YYYY').isValid()) {
            dates['endDate'] = Moment.tz(endStr, 'DD.MM.YYYY', 'Europe/Zurich');
        }
    }
    dates['endDate'] = dates['endDate'] ? dates['endDate'].toISOString() : Moment(dates['startDate']).endOf('day').toISOString();
    dates['startDate'] = dates['startDate'] ? dates['startDate'].toISOString() : Moment().tz('Europe/Zurich').endOf('day').toISOString();
    return dates;
}

Program
  .version(pkg.version)
  .option('-n, --number [number of events]', 'number of events to show [250]', 250)
  .option('-d, --date <date>', 'date for query [today]', 'today')
  .option('-c, --calendar [cal_id]', 'determine which calendar you want to use [primary]', 'primary')
  .option('-m, --mail', 'use mail as source')
  .option('-s, --slack', 'use slack as source')
  .option('-j, --jira', 'use jira as source')
  .option('-g, --git [path]', 'use git as a source')
  .option('-p, --pie', 'print pie chart instead of text')
  .option('-v, --verbose', 'more verbose output [false]', false)
  .parse(process.argv);


var dates = getStartAndEndDate(Program.date);

Moment.suppressDeprecationWarnings = true;
if (!Moment(dates['endDate']).isValid() || !Moment(dates['startDate']).isValid()) {
    console.error("Please enter a valid date range");
    process.exit(1);
}

if (Program.verbose) {
    console.log('Start date: %s', Moment.tz(dates['startDate'], 'Europe/Zurich').format('DD.MM.YYYY'));
    console.log('End date: %s', Moment.tz(dates['endDate'], 'Europe/Zurich').format('DD.MM.YYYY'));
    console.log('Calendar: %s', Program.calendar);
    console.log('Mail: %s', Program.mail);
    console.log('Slack: %s', Program.slack);
    console.log('Jira: %s', Program.jira);
    console.log('Git: %s', Program.git);
    console.log('Pie chart: %s', Program.pie);
    console.log('Count: %s', Program.number);
}

auth.getAuth(function(auth) {
    Async.parallel([
        function(callback) {
            // Google Calendar
            calendar.listEvents(callback, auth, Program.number, dates['startDate'], dates['endDate'], Program.calendar);
        },
        function(callback) {
            // Google Mail
            if (Program.mail) {
                mail.listMessages(callback, auth, Program.number, dates['startDate'], dates['endDate'], Program.verbose);
            } else {
                callback(null, []);
            }
        },
        function(callback) {
            if (Program.slack) {
                slack_auth.getAuth(function(auth) {
                    slack.dailyStats(callback, auth, Program.number, dates['startDate'], dates['endDate'], Program.pie);
                });
            } else {
                callback(null, []);
            }
        },
        function(callback) {
            if (Program.jira) {
                jira_auth.getAuth(function(auth) {
                    jira.getActivities(callback, auth, Program.number, dates['startDate'], dates['endDate'], Program.verbose);
                });
            } else {
                callback(null, []);
            }
        },
        function(callback) {
            if (Program.git) {
                git.getCommits(callback, Program.git, dates['startDate'], dates['endDate'], Program.verbose);
            } else {
                callback(null, []);
            }
        }
    ],
    function(err, results) {
        if (err) {
            console.error("Error occured: ", err);
            return;
        }
        results = _.flatten(results);
        results = _.groupBy(results, 'timestamp');

        //order the resulting object based on timestamp
        var orderedResults = {};
        Object.keys(results).sort().forEach(function(key) {
              orderedResults[key] = results[key];
        });

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
                console.log('# ' + type);
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
        process.exit(0);
    });
});
