var Slack = require('slack-api');
var Moment = require('moment-timezone');
var Async = require('async');
var Pie = require("cli-pie");
var _ = require('underscore');

exports.dailyStats = dailyStats;

/**
 * Lists the daily Slack statistics based on the given parameters
 */
function dailyStats(callback, auth, count, startDate, endDate, graph) {
    var start = Moment.tz(startDate, 'Europe/Zurich').subtract(1, 'd');
    var end = Moment.tz(endDate, 'Europe/Zurich').add(1, 'd');
    var searchArgs = {
            'token': auth,
            'sort': 'timestamp',
            'sort_dir': 'asc',
            'count': 1000,
            'query': 'from:me after:' + start.format('YYYY-MM-DD') + ' before:' + end.format('YYYY-MM-DD')
    };
    Slack.search.messages(searchArgs, function(err, data) {
        if (err) {
            callback('The Slack API returned an error: ' + err);
            return;
        }
        var messages = _.map(data.messages.matches, function(msg) {
            msg['day_timestamp'] = Moment.unix(msg.ts).startOf('day').format('X');
            return msg;
        });
        var messagesByDay = _.groupBy(messages, 'day_timestamp');

        Async.mapValues(messagesByDay, function(dayMsgs, dayTimestamp, dayCb) {
            var messageTypes = _.groupBy(dayMsgs, 'type');

            var privateMsgs = messageTypes['im'];
            var publicMsgs = messageTypes['message'];

            var channels = _.groupBy(publicMsgs, function(match) {
                return match.channel.id;
            });
            var users = _.groupBy(privateMsgs, function(match) {
                return match.channel.name;
            });

            var groupedMessages = Object.assign(channels, users);

            Async.mapValues(
                groupedMessages,
                function(msgs, group, groupCb) {
                    if (group[0] === 'C') {
                        Slack.channels.info({'token': auth, 'channel': group}, function(err, channelData) {
                            if (err) {
                                groupCb(err);
                                return;
                            }
                            var msg = {
                                'project': 'xxx',
                                'time': '',
                                'text': msgs.length + ' messages in #' + channelData.channel.name,
                                'timestamp': dayTimestamp,
                                'type': 'slack',
                                'comment': false,
                                'graph': {'label': channelData.channel.name + ' - ' + msgs.length, 'value': msgs.length }
                            };
                            groupCb(null, msg);
                        });
                    } else {
                        Slack.users.info({'token': auth, 'user': group}, function(err, userData) {
                            var msg = {
                                'project': 'xxx',
                                'time': '',
                                'text': msgs.length + ' messages with ' + userData.user.name,
                                'timestamp': dayTimestamp,
                                'type': 'slack',
                                'graph': {'label': userData.user.name + ' - ' + msgs.length, 'value': msgs.length },
                                'comment': false
                            };
                            groupCb(null, msg);
                        });
                    }
                },
                function(err, msgs) {
                    if (err) {
                        dayCb(err);
                        return;
                    }
                    var template = {'msgs': 'msgs.*' };
                    var mergedMsgs = _.map(msgs, function(msg, key) {
                        return msg;
                    });
                    if (graph) {
                        var pieArgs = _.map(mergedMsgs, function(msg) {
                            return msg.graph;
                        });
                        var pie = new Pie(10, pieArgs, { legend: true });

                        var msg = {
                            'raw': pie.toString(),
                            'timestamp': dayTimestamp,
                            'type': 'slack',
                        };
                        dayCb(null, [msg]);
                    } else {
                        dayCb(err, mergedMsgs);
                    }
                }
            );
        }, function(err, msgs) {
            if (err) {
                callback('The Slack API returned an error: ' + err);
                return;
            }
            callback(null, _.flatten(_.values(msgs)));
        });
    });
}
