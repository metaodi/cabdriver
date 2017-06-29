#!/usr/bin/env node

var Program = require('commander');

var cli = require('./lib/cli');
var pkg = require('./package.json');

Program
  .version(pkg.version)
  .option('-n, --number [number of events]', 'number of events to show [250]', 250)
  .option('-d, --date <date>', 'date for query [today]', 'today')
  .option('-c, --calendar [cal_id]', 'use calendar as a source, if not specified the primary calendar will be used')
  .option('-m, --mail', 'use mail as source')
  .option('-s, --slack', 'use slack as source')
  .option('-l, --logbot', 'use logbot as source')
  .option('-j, --jira', 'use jira as source')
  .option('-z, --zebra', 'use zebra as source')
  .option('-g, --git [path]', 'use git as a source')
  .option('-G, --github', 'use github as a source')
  .option('-L, --gitlab', 'use gitlab as a source')
  .option('-p, --pie', 'print pie chart instead of text')
  .option('-H, --hours', 'prefer output as number of hours instead of time ranges [false]', false)
  .option('-v, --verbose', 'more verbose output [false]', false)
  .parse(process.argv);

cli.run(Program);
