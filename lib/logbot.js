var Moment = require('moment-timezone');
var Request = require('superagent');
var _ = require('lodash');

exports.getLogs = getLogs;

/**
 * Get logs from Logbot
 */
function getLogs(callback, auth, options) {
    var startDateObj = Moment(options.startDate).tz('Europe/Zurich');
    var endDateObj = Moment(options.endDate).tz('Europe/Zurich');
    Request
        .post('https://logbotcmd.herokuapp.com/logs')
        .query({'startDate': startDateObj.format('YYYY-MM-DD')})
        .query({'endDate': endDateObj.format('YYYY-MM-DD')})
        .query({'limit': options.number})
        .send({'token': auth })
        .end(function(err, res) {
            if (err) {
                callback('The Logbot API returned an error: ' + err);
                return;
            }
            var list = _.map(res.body.result, function(log) {
                var project, time, descr;
                var taxiRe = new RegExp(/(\S+)\s+(\S+)\s+(.*)/);
                var match = taxiRe.exec(log.message);
                if (match) {
                    project = match[1];
                    time = match[2];
                    descr = match[3];
                } else {
                    project = 'xxx';
                    time = '1';
                    descr = log.message;
                }
                var msg = {
                    'project': project,
                    'time': time,
                    'text': descr,
                    'timestamp': Moment(log.log_date).startOf('day').format('X'),
                    'type': 'logbot'
                };
                return msg;
            });
            callback(null, list);
        });
}
