var SemanticDate = require('semantic-date');
var Moment = require('moment-timezone');
var _ = require('lodash');

var util = require('./util');

exports.getStartAndEndDate = getStartAndEndDate;
exports.parseTimeRange = parseTimeRange;
exports.parseFirstDayOfMonth = parseFirstDayOfMonth;

// eslint-disable-next-line complexity
function getStartAndEndDate(dateStr) {
    dateStr = dateStr || 'today';
    var dates = {};
    if (dateStr === 'today') {
        dates['startDate'] = Moment().tz('Europe/Zurich').endOf('day');
        dates['endDate'] = dates['startDate'].clone();
    } else if (SemanticDate.validate(dateStr)) {
        var parsed = SemanticDate.convert(dateStr);
        dates['startDate'] = Moment.tz(parsed.start, 'Europe/Zurich').endOf('day');
        dates['endDate'] = Moment.tz(parsed.end, 'Europe/Zurich').endOf('day');
    } else {
        dates = parseDateRange(dateStr);
    }
    if (dates['endDate']) {
        dates['endDate'] = dates['endDate'].toISOString();
    } else {
        dates['endDate'] = Moment(dates['startDate']).endOf('day').toISOString();
    }

    if (dates['startDate']) {
        dates['startDate'] = dates['startDate'].toISOString();
    } else {
        dates['endDate'] = Moment().tz('Europe/Zurich').endOf('day').toISOString();
    }
    return dates;
}

// eslint-disable-next-line complexity
function parseDateRange(dateStr) {
    var dates = {
        'startDate': null,
        'endDate': null
    };
    var dateArr = util.dashed(dateStr);
    var startStr = dateArr[0];
    var endStr = '';
    if (dateArr.length > 1) {
        endStr = dateArr[1];
    }

    if (startStr && Moment(startStr, 'DD.MM.YYYY').isValid()) {
        dates['startDate'] = Moment.tz(startStr, 'DD.MM.YYYY', 'Europe/Zurich');
    }
    if (endStr && Moment(endStr, 'DD.MM.YYYY').isValid()) {
        dates['endDate'] = Moment.tz(endStr, 'DD.MM.YYYY', 'Europe/Zurich');
    }
    return dates;
}

// eslint-disable-next-line complexity
function parseTimeRange(time) {
    var timeRange = new RegExp('^(\\d{2}:\\d{2})-(\\d{2}:\\d{2})$');
    if (timeRange.test(time)) {
        var matches = timeRange.exec(time);
        var d1 = new Moment(matches[1], 'HH:mm');
        var d2 = new Moment(matches[2], 'HH:mm');

        if (!d1.isValid() && d2.isValid) {
            return NaN;
        }
        return d2.diff(d1, 'hours', true);
    }
    return NaN;
}

// eslint-disable-next-line complexity
function parseFirstDayOfMonth(monthStr, yearStr) {
    var startDate;
    if (SemanticDate.validate(monthStr)) {
        var parsed = SemanticDate.convert(monthStr);
        startDate = Moment.tz(parsed.start, 'Europe/Zurich');
    } else if (/^next[ _-]?month$/i.test(monthStr)) {
        startDate = Moment().tz('Europe/Zurich').add(1, 'months');
    } else if (monthStr) {
        if (/^\d+$/.test(monthStr)) {
            var monthNumber = _.parseInt(monthStr) - 1;
            monthStr = monthNumber;
        }
        startDate = Moment().tz('Europe/Zurich').month(monthStr);
    } else {
        startDate = Moment().tz('Europe/Zurich');
    }
    if (yearStr) {
        startDate = startDate.year(yearStr);
    }
    return startDate.startOf('month').toISOString();
}
