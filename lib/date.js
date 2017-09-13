var SemanticDate = require('semantic-date');
var Moment = require('moment-timezone');
var _ = require('lodash');

var util = require('./util');

exports.getStartAndEndDate = getStartAndEndDate;
exports.parseTimeRange = parseTimeRange;
exports.parseFirstDayOfMonth = parseFirstDayOfMonth;

function getStartAndEndDate(dateStr) {
    var dates = {
        'startDate': null,
        'endDate': null
    };
    if (SemanticDate.validate(dateStr)) {
        var parsed = SemanticDate.convert(dateStr);
        dates['startDate'] = Moment.tz(parsed.start, 'Europe/Zurich');
        dates['endDate'] = Moment.tz(parsed.end, 'Europe/Zurich');
    } else {
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
    }
    dates['endDate'] = dates['endDate'] ? dates['endDate'].toISOString() : Moment(dates['startDate']).endOf('day').toISOString();
    dates['startDate'] = dates['startDate'] ? dates['startDate'].toISOString() : Moment().tz('Europe/Zurich').endOf('day').toISOString();
    return dates;
}

function parseTimeRange(time) {
    var timeRange = new RegExp("^(\\d{2}:\\d{2})-(\\d{2}:\\d{2})$");
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

function parseFirstDayOfMonth(monthStr) {
    var startDate;
    if (SemanticDate.validate(monthStr)) {
        var parsed = SemanticDate.convert(monthStr);
        startDate = Moment.tz(parsed.start, 'Europe/Zurich');
    } else if (monthStr) {
        startDate = Moment.tz(monthStr, 'Europe/Zurich');
    } else {
        startDate = Moment().tz('Europe/Zurich');
    }
    return startDate.startOf('month').toISOString();
}
