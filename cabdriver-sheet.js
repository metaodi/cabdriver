#!/usr/bin/env node

var Program = require('commander');

var sheet = require('./cli/sheet');
var pkg = require('./package.json');

Program
  .version(pkg.version)
  .option('-m, --month <month>', 'month to print the sheet [this-month]', 'this-month')
  .parse(process.argv);

sheet.run(Program.opts());
