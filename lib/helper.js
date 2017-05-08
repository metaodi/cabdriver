var _ = require('lodash');

exports.printVerbose = printVerbose;
exports.logVerbose = logVerbose;
exports.errorVerbose = errorVerbose;

function msgVerbose(fn, verbose) {
    if (verbose) {
        fn();
    }
}

function printVerbose(msg, verbose) {
    var write = _.bind(process.stdout.write, process.stdout, msg);
    msgVerbose(write, verbose);
}

function logVerbose(msg, verbose) {
    var log = _.bind(console.log, console, msg);
    msgVerbose(log, verbose);
}

function errorVerbose(msg, verbose) {
    var error = _.bind(console.error, console, msg);
    msgVerbose(error, verbose);
}
