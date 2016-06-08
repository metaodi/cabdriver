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
            dates['startDate'] = Moment(startStr, 'DD.MM.YYYY').tz('Europe/Zurich');
        }
        if (endStr && Moment(endStr, 'DD.MM.YYYY').isValid()) {
            dates['endDate'] = Moment(endStr, 'DD.MM.YYYY').tz('Europe/Zurich');
        }
    }
    dates['endDate'] = dates['endDate'] ? dates['endDate'].toISOString() : Moment(dates['startDate']).endOf('day').toISOString();
    dates['startDate'] = dates['startDate'].toISOString();
    return dates;
}

Program
  .version(pkg.version)
  .option('-n, --number [number of events]', 'number of events to show [250]', 250)
  .option('-d, --date <date>', 'date for query [today]', 'today')
  .option('-c, --calendar [cal_id]', 'determine which calendar you want to use [primary]', 'primary')
  .option('-v, --verbose', 'more verbose output [false]', false)
  .parse(process.argv);


var dates = getStartAndEndDate(Program.date);

if (Program.verbose) {
    console.log('Start date: %s', Moment.tz(dates['startDate'], 'Europe/Zurich').format('DD.MM.YYYY'));
    console.log('End date: %s', Moment.tz(dates['endDate'], 'Europe/Zurich').format('DD.MM.YYYY'));
    console.log('Calendar: %s', Program.calendar);
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
            mail.listMessages(callback, auth, Program.number, dates['startDate'], dates['endDate']);
        },
    ],
    function(err, results) {
        // var currentDay = '';
        // var start = event.start.dateTime || event.start.date;
        // var day = Moment(start);
        // start = Moment(start).format('HH:mm');
        // var end = event.end.dateTime || event.end.date;
        // end = Moment(end).format('HH:mm');

        // if (day.format('DD.MM.YYYY') !== currentDay) {
        //     console.log('');
        //     console.log('%s # %s', day.format('DD/MM/YYYY'), day.format('dddd'));
        //     currentDay = day.format('DD.MM.YYYY');
        // }
        //
        results = _.flatten(results);

        console.dir(results);
        _.each(results, function(result) {
            console.log(result);
        });        
    });
});
