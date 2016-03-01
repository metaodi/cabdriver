#!/usr/bin/env node

var program = require('commander');
var auth = require('./lib/auth');
var calendar = require('./lib/calendar');


program
  .version('0.0.1')
  .option('-n, --next [count]', 'Show next events [10]', 10)
  .parse(process.argv);

if (program.next) {
    auth.getAuth(function(auth) {
        calendar.listNextEvents(auth, program.next);
    });
}
