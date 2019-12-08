'use strict';

var Moment = require('moment-timezone');
var Promise = require('bluebird');
var Pie = require('cli-pie');
var _ = require('lodash');

var Source = require('./source');

class Slack extends Source {
    constructor(options, auth, api) {
        super(options, auth);
        this.type = 'slack';
        this.api = api || require('slack-api').promisify();
    }

    // eslint-disable-next-line max-lines-per-function 
    generateEntries(auth) {
        var me = this;
        var start = Moment.tz(me.options.startDate, 'Europe/Zurich').subtract(1, 'd');
        var end = Moment.tz(me.options.endDate, 'Europe/Zurich').add(1, 'd');
        var searchArgs = {
            'token': auth,
            'sort': 'timestamp',
            'sort_dir': 'asc',
            'count': 1000,
            'query': 'from:me after:' + start.format('YYYY-MM-DD') + ' before:' + end.format('YYYY-MM-DD')
        };
        return me.api.search.messages(searchArgs)
            .then(function(data) {
                var messages = _.map(data.messages.matches, function(msg) {
                    msg['day_timestamp'] = Moment.unix(msg.ts).tz('Europe/Zurich').startOf('day').format('X');
                    return msg;
                });
                var messagesByDay = _.groupBy(messages, 'day_timestamp');
                return messagesByDay;
            })
            .then(function(messagesByDay) {
                return Promise.props(
                    _.mapValues(messagesByDay, function(dayMsgs, dayTimestamp) {
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
                        return me.generateDailyAggregates(groupedMessages, dayTimestamp, auth);
                    })
                );
            })
            .then(function(msgs) {
                return _.flatten(_.values(msgs));
            })
            .catch(function(err) {
                throw new Error('The Slack API returned an error: ' + err);
            });
    }

    // eslint-disable-next-line max-lines-per-function 
    generateDailyAggregates(dailyMsgs, dayTimestamp, auth) {
        var me = this;
        return Promise.props(
            _.mapValues(dailyMsgs, function(msgs, group) {
                if (group[0] === 'C') {
                    return me.api.channels.info(
                        {'token': auth, 'channel': group}
                    ).then(function(channelData) {
                        return me.getChannelMsg(msgs, dayTimestamp, channelData);
                    });
                } else {
                    return me.api.users.info(
                        {'token': auth, 'user': group}
                    ).then(function(userData) {
                        return me.getUserMsg(msgs, dayTimestamp, userData);
                    });
                }
            })
        ).then(function(msgs) {
            var mergedMsgs = _.map(msgs, function(msg, key) {
                return msg;
            });
            if (me.options.pie) {
                var pieArgs = _.map(mergedMsgs, function(msg) {
                    return msg.graph;
                });
                var pie = new Pie(10, pieArgs, { legend: true });

                var msg = {
                    'raw': pie.toString(),
                    'timestamp': dayTimestamp,
                    'type': 'slack',
                };
                return [msg];
            } else {
                return mergedMsgs;
            }
        });
    }

    getChannelMsg(msgs, dayTimestamp, channelData) {
        var msg = {
            'project': 'xxx',
            'time': '',
            'text': msgs.length + ' messages in #' + channelData.channel.name,
            'timestamp': dayTimestamp,
            'type': 'slack',
            'comment': false,
            'graph': {'label': channelData.channel.name + ' - ' + msgs.length, 'value': msgs.length }
        };
        return msg;
    }

    getUserMsg(msgs, dayTimestamp, userData) {
        var msg = {
            'project': 'xxx',
            'time': '',
            'text': msgs.length + ' messages with ' + userData.user.name,
            'timestamp': dayTimestamp,
            'type': 'slack',
            'graph': {'label': userData.user.name + ' - ' + msgs.length, 'value': msgs.length },
            'comment': false
        };
        return msg;
    }
}    

module.exports = Slack;
