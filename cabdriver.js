#!/usr/bin/env node

var Program = require('commander');

var pkg = require('./package.json');

Program
    .version(pkg.version)
    .allowUnknownOption()
    .command('fetch', 'Fetches taxi entries from different sources', {isDefault: true})
    .command('sheet', 'Prints a monthly sheet')
    .parse(process.argv);
