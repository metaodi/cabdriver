#!/usr/bin/env node

var Program = require('commander');
var SemanticDate = require('semantic-date');
var Moment = require('moment-timezone');
var _ = require('underscore');

var auth = require('./lib/auth');
var calendar = require('./lib/calendar');
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
        dates['startDate'] = parsed.start;
        dates['endDate'] = parsed.end;
    } else {
        var dateArr = dashed(dateStr);
        var startStr = dateArr[0];
        var endStr = '';
        if (dateArr.length > 1) {
            endStr = dateArr[1];
        }

        if (startStr && Moment(startStr, 'DD.MM.YYYY').isValid()) {
            dates['startDate'] = Moment(startStr, 'DD.MM.YYYY');
        }
        if (endStr && Moment(endStr, 'DD.MM.YYYY').isValid()) {
            dates['endDate'] = Moment(endStr, 'DD.MM.YYYY');
        }
    }
    dates['startDate'] = Moment(dates['startDate']).tz('Europe/Zurich').toISOString();
    dates['endDate'] = dates['endDate'] ? Moment(dates['endDate']).tz('Europe/Zurich').endOf('day').toISOString() : '';
    return dates;
}

Program
  .version(pkg.version)
  .option('-n, --number [number of events]', 'number of events to show [10]', 10)
  .option('-d, --date <date>', 'date for query [today]', 'today')
  .option('-c, --calendar [cal_id]', 'determine which calendar you want to use [primary]', 'primary')
  .option('-v, --verbose', 'more verbose output [false]', false)
  .parse(process.argv);


var dates = getStartAndEndDate(Program.date);

if (Program.verbose) {
    console.log('Start date: %s', dates['startDate']);
    console.log('End date: %s', dates['endDate']);
    console.log('Calendar: %s', Program.calendar);
    console.log('Count: %s', Program.number);
}

if (Program.number) {
    auth.getAuth(function(auth) {
        calendar.listEvents(auth, Program.number, dates['startDate'], dates['endDate'], Program.calendar);
    });
}
