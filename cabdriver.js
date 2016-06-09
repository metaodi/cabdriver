#!/usr/bin/env node

var Program = require('commander');
var SemanticDate = require('semantic-date');
var Moment = require('moment-timezone');
var Async = require('async');
var _ = require('underscore');

var auth = require('./lib/auth');
var calendar = require('./lib/calendar');
var mail = require('./lib/mail');
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
        dates['startDate'] = Moment(parsed.start).tz('Europe/Zurich');
        dates['endDate'] = Moment(parsed.end).tz('Europe/Zurich');
    } else {
        var dateArr = dashed(dateStr);
        var startStr = dateArr[0];
        var endStr = '';
        if (dateArr.length > 1) {
            endStr = dateArr[1];
        }

        if (startStr && Moment(startStr, 'DD.MM.YYYY').isValid()) {
            dates['startDate'] = Moment(startStr, 'DD.MM.YYYY').tz('Europe/Zurich');
        }
        if (endStr && Moment(endStr, 'DD.MM.YYYY').isValid()) {
            dates['endDate'] = Moment(endStr, 'DD.MM.YYYY').tz('Europe/Zurich');
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
  .option('-v, --verbose', 'more verbose output [false]', false)
  .parse(process.argv);


var dates = getStartAndEndDate(Program.date);

if (Program.verbose) {
    console.log('Start date: %s', Moment.tz(dates['startDate'], 'Europe/Zurich').format('DD.MM.YYYY'));
    console.log('End date: %s', Moment.tz(dates['endDate'], 'Europe/Zurich').format('DD.MM.YYYY'));
    console.log('Calendar: %s', Program.calendar);
    console.log('Mail: %s', Program.mail);
    console.log('Count: %s', Program.number);
}

auth.getAuth(function(auth) {
    Async.series([
        function(callback) {
            // Google Calendar
            calendar.listEvents(callback, auth, Program.number, dates['startDate'], dates['endDate'], Program.calendar);
        },
        function(callback) {
            // Google Mail
            if (Program.mail) {
                mail.listMessages(callback, auth, Program.number, dates['startDate'], dates['endDate']);
            } else {
                callback(null, []);
            }
        },
    ],
    function(err, results) {
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

            msgs = _.groupBy(msgs, 'type');
            console.log('');
            console.log('%s # %s', day.format('DD/MM/YYYY'), day.format('dddd'));
            _.each(msgs, function(msgs, type) {
                console.log('# ' + type);
                _.each(msgs, function(msg) {
                    console.log(msg.text);
                });
            });

        });

    });
});
