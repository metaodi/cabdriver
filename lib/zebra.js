var Moment = require('moment-timezone');
var Async = require('async');
var Request = require('superagent');
var Pie = require('cli-pie');
var _ = require('lodash');

exports.getTimesheets = getTimesheets;

function getTimesheets(callback, auth, options) {
    var startDateObj = Moment(options.startDate).tz('Europe/Zurich');
    var endDateObj = Moment(options.endDate).tz('Europe/Zurich');
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
                    'project': entry.occupation_alias || entry.project_name,
                    'time': entry.time,
                    'text': entry.description,
                    'timestamp': Moment.tz(entry.date, 'Europe/Zurich').startOf('day').format('X'),
                    'type': 'zebra',
                    'comment': true,
                    'graph': {'label': entry.project_name + ' - ' + entry.time, 'value': parseFloat(entry.time) }
                };
                return msg;
            });
            if (options.pie) {
                var pieArgs = _.map(list, function(msg) {
                    return msg.graph;
                });
                var pie = new Pie(10, pieArgs, { legend: true, display_total: true, total_label: "Total Hours" });

                var msg = {
                    'raw': pie.toString(),
                    'timestamp': startDateObj.startOf('day').format('X'),
                    'type': 'zebra',
                };
                callback(null, [msg]);
            } else {
                callback(null, list);
            }
        });
}
