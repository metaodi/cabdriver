var Moment = require('moment-timezone');

var date = require('../lib/date');

var Cli = require('./cli');

Moment.suppressDeprecationWarnings = true;

class SheetCli extends Cli {
    run() {
        var me = this;
        me.printSheet();
    }

    getCmdName() {
        return 'sheet';
    }

    printSheet() {
        var me = this;
        var startDate = date.parseFirstDayOfMonth(me.options.month);
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
