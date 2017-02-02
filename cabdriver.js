#!/usr/bin/env node

var Program = require('commander');
var SemanticDate = require('semantic-date');
var Moment = require('moment-timezone');
var Async = require('async');
var Pad = require('pad');
var Yaml = require('js-yaml');
var _ = require('lodash');

var fs = require('fs');

var auth = require('./lib/auth');
var slack_auth = require('./lib/slack_auth');
var jira_auth = require('./lib/jira_auth');
var zebra_auth = require('./lib/zebra_auth');
var calendar = require('./lib/calendar');
var mail = require('./lib/mail');
var slack = require('./lib/slack');
var jira = require('./lib/jira');
var zebra = require('./lib/zebra');
var git = require('./lib/git');
var pkg = require('./package.json');

exports.getStartAndEndDate = getStartAndEndDate;

function dashed(val) {
    var splitted = val.split('-');
    return _.map(splitted, function(elem) {
        return elem.trim();
    });
}

function filterFloat(value) {
    if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)) {
      return Number(value);
    }
    return NaN;
}

function parseTimeRange(time) {
    var timeRange = new RegExp("^(\\d{2}:\\d{2})-(\\d{2}:\\d{2})$");
    if (timeRange.test(time)) {
        var matches = timeRange.exec(time);
        var d1 = new Moment(matches[1], 'HH:mm');
        var d2 = new Moment(matches[2], 'HH:mm');

        if (!d1.isValid() && d2.isValid) {
            return NaN;
        }
        return d2.diff(d1, 'hours', true);
    }
    return NaN;
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

//load config file
var config;
try {
    var CONFIG_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.cabdriver/';
    var CONFIG_PATH = CONFIG_DIR + 'cabdriver.yml';
    config = Yaml.safeLoad(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (!_.has(config, 'defaults')) {
        console.error("Config file has no 'defaults' key");
        throw "malformated config";
    }
} catch (e) {
    config = {'defaults': {}};
}

Program
  .version(pkg.version)
  .option('-n, --number [number of events]', 'number of events to show [250]', 250)
  .option('-d, --date <date>', 'date for query [today]', 'today')
  .option('-c, --calendar [cal_id]', 'use calendar as a source, if not specified the primary calendar will be used')
  .option('-m, --mail', 'use mail as source')
  .option('-s, --slack', 'use slack as source')
  .option('-j, --jira', 'use jira as source')
  .option('-z, --zebra', 'use zebra as source')
  .option('-g, --git [path]', 'use git as a source')
  .option('-p, --pie', 'print pie chart instead of text')
  .option('-v, --verbose', 'more verbose output [false]', false)
  .parse(process.argv);


var options = {};
var sourceKeys = ['calendar', 'mail', 'slack', 'jira', 'zebra', 'git'];
var calledWithoutSources = _.every(Program.opts(), function(value, key) {
    return sourceKeys.indexOf(key) < 0 || !value;
});

if (calledWithoutSources) {
    _.assignIn(options, Program.opts(), config.defaults);
} else {
    _.assignIn(options, config.defaults, Program.opts());
}

var dates = getStartAndEndDate(options.date);

Moment.suppressDeprecationWarnings = true;
if (!Moment(dates['endDate']).isValid() || !Moment(dates['startDate']).isValid()) {
    console.error("Please enter a valid date range");
    process.exit(1);
}

if (options.verbose) {
    console.log('Start date: %s', Moment.tz(dates['startDate'], 'Europe/Zurich').format('DD.MM.YYYY'));
    console.log('End date: %s', Moment.tz(dates['endDate'], 'Europe/Zurich').format('DD.MM.YYYY'));
    console.log('Calendar: %s', options.calendar);
    console.log('Mail: %s', options.mail);
    console.log('Slack: %s', options.slack);
    console.log('Jira: %s', options.jira);
    console.log('Zebra: %s', options.zebra);
    console.log('Git: %s', options.git);
    console.log('Pie chart: %s', options.pie);
    console.log('Count: %s', options.number);
}

Async.parallel([
    function(callback) {
        // Google Calendar
        if (options.calendar) {
            auth.getAuth(function(auth) {
                if (_.isBoolean(options.calendar)) {
                    options.calendar = 'primary';
                }
                calendar.listEvents(callback, auth, options.number, dates['startDate'], dates['endDate'], options.calendar);
            });
        } else {
            callback(null, []);
        }
    },
    function(callback) {
        // Google Mail
        if (options.mail) {
            auth.getAuth(function(auth) {
                mail.listMessages(callback, auth, options.number, dates['startDate'], dates['endDate'], options.verbose);
            });
        } else {
            callback(null, []);
        }
    },
    function(callback) {
        if (options.slack) {
            slack_auth.getAuth(function(auth) {
                slack.dailyStats(callback, auth, options.number, dates['startDate'], dates['endDate'], options.pie);
            });
        } else {
            callback(null, []);
        }
    },
    function(callback) {
        if (options.jira) {
            jira_auth.getAuth(function(auth) {
                jira.getActivities(callback, auth, options.number, dates['startDate'], dates['endDate'], options.verbose);
            });
        } else {
            callback(null, []);
        }
    },
    function(callback) {
        if (options.zebra) {
            zebra_auth.getAuth(function(auth) {
                zebra.getTimesheets(callback, auth, options.number, dates['startDate'], dates['endDate'], options.verbose, options.pie);
            });
        } else {
            callback(null, []);
        }
    },
    function(callback) {
        if (options.git) {
            git.getCommits(callback, options.git, dates['startDate'], dates['endDate'], options.verbose);
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
        console.log('');
        console.log('%s # %s', day.format('DD/MM/YYYY'), day.format('dddd'));
        _.each(msgs, function(msgs, type) {
            var total = _.reduce(msgs, function(sum, msg) {
               var time = filterFloat(msg.time);
               if (_.isNaN(time)) {
                   time = parseTimeRange(msg.time);
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
    process.exit(0);
});
