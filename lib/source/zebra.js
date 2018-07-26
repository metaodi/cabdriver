"use strict";

var Moment = require('moment-timezone');
var Async = require('async');
var Request = require('superagent');
var Pie = require('cli-pie');
var _ = require('lodash');

var Source = require('./source');

class Zebra extends Source {
    constructor(options, auth) {
        super(options, auth);
        this.type = 'zebra';
    }

    generateEntries(auth) {
        var me = this;
        var startDateObj = Moment(me.options.startDate).tz('Europe/Zurich');
        var endDateObj = Moment(me.options.endDate).tz('Europe/Zurich');
        return Request
            .get('https://zebra.liip.ch/api/v2/timesheets')
            .query({'token': auth })
            .query({'start_date': startDateObj.format('YYYY-MM-DD')})
            .query({'end_date': endDateObj.format('YYYY-MM-DD')})
            .then(function(res) {
                var list = _.map(res.body.data.list, function(entry) {
                    var msg = {
                        'project': entry.occupation_alias || entry.project_name,
                        'time': entry.time.toString(),
                        'text': entry.description,
                        'timestamp': Moment.tz(entry.date, 'Europe/Zurich').startOf('day').format('X'),
                        'type': 'zebra',
                        'comment': true,
                        'graph': {'label': entry.project_name + ' - ' + entry.time, 'value': parseFloat(entry.time) }
                    };
                    return msg;
                });
                if (me.options.pie) {
                    var pieArgs = _.map(list, function(msg) {
                        return msg.graph;
                    });
                    var pie = new Pie(10, pieArgs, { legend: true, display_total: true, total_label: "Total Hours" });

                    var msg = {
                        'raw': pie.toString(),
                        'timestamp': startDateObj.startOf('day').format('X'),
                        'type': 'zebra',
                    };
                    return [msg];
                } else {
                    return list;
                }
            })
            .catch(function(err) {
                throw new Error('The Zebra API returned an error: ' + err);
            });
    } 
}

module.exports = Zebra;
