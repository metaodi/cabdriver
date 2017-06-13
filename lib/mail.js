var Google = require('googleapis');
var Moment = require('moment-timezone');
var Async = require('async');
var _ = require('lodash');

var helper = require('./helper');

function Mail() {}

Mail.prototype.listMessages = function(callback, auth, options) {
    var me = this;
    var mail = Google.gmail('v1');
    var mailArgs = {
        auth: auth,
        userId: 'me'
    };
    mailArgs['maxResults'] = options.count || 10;
    var afterDate = Moment.tz(options.startDate, 'Europe/Zurich') || Moment().tz('Europe/Zurich');
    mailArgs['q'] = 'after:' + afterDate.subtract(1, 'd').endOf('day').format('X');

    if (options.endDate) {
        mailArgs['q'] += ' AND before:' + Moment.tz(options.endDate, 'Europe/Zurich').add(1, 'd').startOf('day').format('X');
    }

    mail.users.messages.list(
        mailArgs,
        function(err, response) {
            if (err) {
                callback('The Google Mail API returned an error: ' + err);
                return;
            }
            helper.logVerbose("Fetching mails:", options.verbose);
            helper.printVerbose('[', options.verbose);
            Async.mapLimit(
                response.messages,
                5,
                function(msg, callback) {
                    helper.printVerbose("=", options.verbose);
                    return me.handleMessage(auth, msg, callback);
                },
                function(err, results) {
                    helper.printVerbose("]\n", options.verbose);
                    callback(err, results.reverse());
                }
            );
        }
    );
};

Mail.prototype.handleMessage = function(auth, msg, callback) {
    var mail = Google.gmail('v1');
    mail.users.messages.get({
        auth: auth,
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject']
    }, function (err, response) {
        if (err) {
            callback('The Google Mail API returned an error: ' + err);
            return;
        }
        var msgDate = Moment(response.internalDate, 'x').tz('Europe/Zurich');
        var subject = _.find(response.payload.headers, function(header) {
            return header.name === 'Subject';
        }).value;
        if (subject.length > 80) {
            subject = subject.substring(0,80).trim() + '...';
        }

        var from = _.find(response.payload.headers, function(header) {
            return header.name === 'From';
        }).value;

        var msg = {
            'project': 'xxx',
            'time': msgDate.format('HH:mm'),
            'text': subject + ' (From: ' + from + ')',
            'timestamp': msgDate.startOf('day').format('X'),
            'type': 'mail',
            'comment': false
        };

        callback(null, msg);
    });
};

module.exports = new Mail();
