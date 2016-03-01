#!/usr/bin/env node

var Program = require('commander');
var Chrono = require('chrono-node');
var SemanticDate = require('semantic-date');
var Moment = require('moment-timezone');

var auth = require('./lib/auth');
var calendar = require('./lib/calendar');

function dashed(val) {
    return val.split('-').join(' ');
}

Program
  .version('0.0.1')
  .option('-c, --count [number of events]', 'Amount of events to show [10]', 10)
  .option('-d, --date <date>', 'Date for query [today]', dashed, 'today')
  .option('-c, --calendar [cal_id]', 'Determine which calendar you want to use [primary]', 'primary')
  .parse(process.argv);


var startDate = null;
var endDate = null;

if (SemanticDate.validate(Program.date)) {
    var parsed = SemanticDate.convert(Program.date);
    startDate = parsed.start;
    endDate = parsed.end;
} else {
    var dates = Program.date.split(' ');
    var startStr = dates[0];
    var endStr = dates[1]

    if (startStr && Moment(startStr, 'DD.MM.YYYY').isValid()) {
        startDate = Moment(startStr, 'DD.MM.YYYY');
    }
    if (endStr && Moment(endStr, 'DD.MM.YYYY').isValid()) {
        endDate = Moment(endStr, 'DD.MM.YYYY').endOf('day');
    }
}

startDate = Moment(startDate).toISOString();
endDate = endDate ? Moment(endDate).toISOString() : '';

if (Program.count) {
    auth.getAuth(function(auth) {
        calendar.listEvents(auth, Program.count, startDate, endDate, Program.calendar);
    });
}
