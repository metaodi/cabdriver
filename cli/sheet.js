var Moment = require('moment-timezone');

var date = require('../lib/date');

var Cli = require('./cli');

Moment.suppressDeprecationWarnings = true;

class SheetCli extends Cli {
    run(options) {
        var me = this;
        // get the month for the sheet
        var startDate = date.parseFirstDayOfMonth(options.month);
        me.printSheet(startDate);
    }

    printSheet(startDate) {
        var firstDay = Moment.tz(startDate, 'Europe/Zurich');
        console.log('# taxi file for ' + firstDay.format('MM.Y') + "\n");

        var day;
        var currentDay = firstDay.clone();
        for (day = 1; day <= firstDay.daysInMonth(); day++) {
            console.log(currentDay.format('DD/MM/YYYY') + ' # ' + currentDay.format('dddd') + "\n");
            currentDay.add(1, 'd');
        }
    }
}

module.exports = SheetCli;
