var Moment = require('moment-timezone');

var date = require('../lib/date');

exports.run = run;
exports.printSheet = printSheet;

Moment.suppressDeprecationWarnings = true;


function run(options) {
    // get the month for the sheet
    var startDate = date.parseFirstDayOfMonth(options.month);
    printSheet(startDate);
}

function printSheet(startDate) {
    var firstDay = Moment.tz(startDate, 'Europe/Zurich');
    console.log('# taxi file for ' + firstDay.format('MM.Y') + "\n");

    var day;
    var currentDay = firstDay.clone();
    for (day = 1; day <= firstDay.daysInMonth(); day++) {
        console.log(currentDay.format('DD/MM/YYYY') + ' # ' + currentDay.format('dddd') + "\n");
        currentDay.add(1, 'd');
    }
}
