"use strict";

var Moment = require('moment-timezone');
var Request = require('superagent');
var _ = require('lodash');

var Source = require('./source');

class Logbot extends Source {
    constructor(options, auth) {
        super(options, auth);
        this.type = 'logbot';
    }

    generateEntries(auth) {
        var me = this;
        var startDateObj = Moment(me.options.startDate).tz('Europe/Zurich');
        var endDateObj = Moment(me.options.endDate).tz('Europe/Zurich');
        return Request
            .post('https://logbotcmd.herokuapp.com/logs')
            .query({'startDate': startDateObj.format('YYYY-MM-DD')})
            .query({'endDate': endDateObj.format('YYYY-MM-DD')})
            .query({'limit': me.options.number})
            .send({'token': auth })
            .then(function(res) {
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
                        'timestamp': Moment.tz(log.log_date, 'Europe/Zurich').startOf('day').format('X'),
                        'type': 'logbot'
                    };
                    return msg;
                });
                return list;
            })
            .catch(function(err) {
                throw new Error('The Logbot API returned an error: ' + err);
            });
    }
}

module.exports = Logbot;
