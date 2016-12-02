var Moment = require('moment-timezone');
var Async = require('async');
var Request = require('superagent');
var Pie = require("cli-pie");
var _ = require('underscore');

exports.getTimesheets = getTimesheets;

function getTimesheets(callback, auth, count, startDate, endDate, verbose, graph) {
    var startDateObj = Moment(startDate).tz('Europe/Zurich');
    var endDateObj = Moment(endDate).tz('Europe/Zurich');
    console.log("HERE 1");
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
                    'comment': true,
                    'graph': {'label': entry.project_name + ' - ' + entry.time, 'value': parseFloat(entry.time) }
                };
                return msg;
            });
            if (graph) {
                var pieArgs = _.map(list, function(msg) {
                    return msg.graph;
                });
                var pie = new Pie(10, pieArgs, { legend: true });

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
