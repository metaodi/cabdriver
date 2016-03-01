#!/usr/bin/env node

var Program = require('commander');
var SemanticDate = require('semantic-date');
var Moment = require('moment');
var _ = require('underscore');

var auth = require('./lib/auth');
var calendar = require('./lib/calendar');
var pkg = require('./package.json');

function dashed(val) {
    var splitted = val.split('-');
    return _.map(splitted, function(elem) {
        return elem.trim();
    });
}

Program
  .version(pkg.version)
  .option('-n, --number [number of events]', 'number of events to show [10]', 10)
  .option('-d, --date <date>', 'date for query [today]', 'today')
  .option('-c, --calendar [cal_id]', 'determine which calendar you want to use [primary]', 'primary')
  .option('-v, --verbose', 'more verbose output [false]', false)
  .parse(process.argv);


var startDate = null;
var endDate = null;

if (SemanticDate.validate(Program.date)) {
    var parsed = SemanticDate.convert(Program.date);
    startDate = parsed.start;
    endDate = parsed.end;
} else {
    var dates = dashed(Program.date);
    var startStr = dates[0];
    var endStr = '';
    if (dates.length > 1) {
        endStr = dates[1].trim();
    }

    if (startStr && Moment(startStr, 'DD.MM.YYYY').isValid()) {
        startDate = Moment(startStr, 'DD.MM.YYYY');
    }
    if (endStr && Moment(endStr, 'DD.MM.YYYY').isValid()) {
        endDate = Moment(endStr, 'DD.MM.YYYY');
    }
}

startDate = Moment(startDate).toISOString();
endDate = endDate ? Moment(endDate).endOf('day').toISOString() : '';

if (Program.verbose) {
    console.log('Start date: %s', startDate);
    console.log('End date: %s', endDate);
    console.log('Calendar: %s', Program.calendar);
    console.log('Count: %s', Program.number);
}

if (Program.number) {
    auth.getAuth(function(auth) {
        calendar.listEvents(auth, Program.number, startDate, endDate, Program.calendar);
    });
}
