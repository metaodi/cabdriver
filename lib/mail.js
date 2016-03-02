var Google = require('googleapis');
var Moment = require('moment-timezone');
var _ = require('underscore');

exports.listMessages = listMessages;

var mail = Google.gmail('v1');

/**
 * Lists messages based of the given parameters
 */
function listMessages(auth, count, startDate, endDate) {
    var mailArgs = {
        auth: auth,
        userId: 'me'
    };
    mailArgs['maxResults'] = count || 10;
    var afterDate = Moment(startDate) || Moment();
    mailArgs['q'] = 'after:' + afterDate.subtract(1, 'd').format('x');

    if (endDate) {
        mailArgs['q'] += ' AND before:' + Moment(endDate).add(1, 'd').format('x');
    }

    mail.users.messages.list(
        mailArgs,
        function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            _.each(response.messages, function(msg) {
                handleMessage(auth, msg);
            });
        }
    );
}

function handleMessage(auth, msg) {
    console.log(msg);
    mail.users.messages.get({
        auth: auth,
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject']
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var msgDate = Moment(response.internalDate, 'x').tz('Europe/Zurich').format('DD.MM.YYYY HH:mm');
        var subject = response.payload.headers[0].value;
        var from = response.payload.headers[1].value;

        console.log('xxx    %s      %s (From: %s)', msgDate, subject, from);
    });

}
