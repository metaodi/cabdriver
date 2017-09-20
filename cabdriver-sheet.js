#!/usr/bin/env node

var Program = require('commander');

var SheetCli = require('./cli/sheet');
var pkg = require('./package.json');

Program
  .version(pkg.version)
  .option('-m, --month <month>', 'month to print the sheet [this-month]', 'this-month')
  .option('-T, --test', 'for internal use only [false]', false)
  .parse(process.argv);

var sheet = new SheetCli(Program.opts());
sheet.run();
