var Moment = require('moment-timezone');
var Async = require('async');
var Request = require('superagent');
var _ = require('underscore');

exports.getTimesheets = getTimesheets;

function getTimesheets(callback, auth, count, startDate, endDate, verbose) {
    var startDateObj = Moment(startDate).tz('Europe/Zurich');
    var endDateObj = Moment(endDate).tz('Europe/Zurich');
    Request
        .get('https://zebra.liip.ch/api/v2/timesheets')
        .query({'token': auth })
        .query({'start_date': startDateObj.format('YYYY-MM-DD')})
        .query({'end_date': endDateObj.format('YYYY-MM-DD')})
        .end(function(err, res) {
            if (err) {
                callback('The Zebra API returned an error: ' + err);
                return;
            }
            var list = _.map(res.body.data.list, function(entry) {
                var msg = {
                    'project': entry.alias || entry.project_name,
                    'time': entry.time,
                    'text': entry.description,
                    'timestamp': Moment(entry.date).startOf('day').format('X'),
                    'type': 'zebra',
                    'comment': true
                };
                return msg;
            });
            callback(null, list);
        });
}
