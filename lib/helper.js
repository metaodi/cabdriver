exports.printVerbose = printVerbose;
exports.logVerbose = printVerbose;

function printVerbose(msg, verbose) {
    if (verbose) {
        process.stdout.write(msg);
    }
}

function logVerbose(msg, verbose) {
    if (verbose) {
        console.log(msg);
    }
}
