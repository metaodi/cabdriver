var Google = require('googleapis');
var Moment = require('moment-timezone');
var Async = require('async');
var _ = require('underscore');

exports.listMessages = listMessages;

var mail = Google.gmail('v1');

/**
 * Lists messages based of the given parameters
 */
function listMessages(callback, auth, count, startDate, endDate) {
    var mailArgs = {
        auth: auth,
        userId: 'me'
    };
    mailArgs['maxResults'] = count || 10;
    var afterDate = Moment.tz(startDate, 'Europe/Zurich') || Moment().tz('Europe/Zurich');
    mailArgs['q'] = 'after:' + afterDate.subtract(1, 'd').format('YYYY-MM-DD');

    if (endDate) {
        mailArgs['q'] += ' AND before:' + Moment.tz(endDate, 'Europe/Zurich').add(1, 'd').format('YYYY-MM-DD');
    }

    mail.users.messages.list(
        mailArgs,
        function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            Async.map(
                response.messages,
                function(msg, callback) {
                    return handleMessage(auth, msg, callback);
                },
                callback
            );
        }
    );
}

function handleMessage(auth, msg, callback) {
    mail.users.messages.get({
        auth: auth,
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject']
    }, function (err, response) {
        if (err) {
            callback('The API returned an error: ' + err);
            return;
        }
        var msgDate = Moment(response.internalDate, 'x').tz('Europe/Zurich').format('DD.MM.YYYY HH:mm');
        var subject = _.find(response.payload.headers, function(header) {
            return header.name === 'Subject';
        }).value;
        if (subject.length > 80) {
            subject = subject.substring(0,80).trim() + '...';
        }

        var from = _.find(response.payload.headers, function(header) {
            return header.name === 'From';
        }).value;

        callback(null, 'xxx    ' + msgDate + '      ' + subject + ' (From: ' + from + ')');
    });
}
