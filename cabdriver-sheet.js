#!/usr/bin/env node

var Program = require('commander');

var SheetCli = require('./cli/sheet');
var pkg = require('./package.json');

Program
    .version(pkg.version)
    .option('-m, --month <month>', 'month of sheet to print (defaults to current month)', '')
    .option('-y, --year <year>', 'year of sheet to print (defaults to current year)', '')
    .option('-C, --config <path>', 'path to config file (defaults to ~/.cabdriver/cabdriver.yml)', false)
    .option('-T, --test', 'for internal use only [false]', false)
    .parse(process.argv);

var sheet = new SheetCli(Program.opts());
sheet.run();
