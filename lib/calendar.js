var Google = require('googleapis');
var Moment = require('moment-timezone');
var _ = require('underscore');

exports.listEvents = listEvents;

/**
 * Lists events based of the given parameters
 */
function listEvents(callback, auth, count, startDate, endDate, calendarId) {
    var calendarArgs = {
        auth: auth,
        singleEvents: true,
        orderBy: 'startTime'
    };
    calendarArgs['maxResults'] = count || 10;
    calendarArgs['timeMin'] = startDate || (new Date()).toISOString();
    if (endDate) {
        calendarArgs['timeMax'] = Moment.tz(endDate, 'Europe/Zurich').add(1, 'd').startOf('day').toISOString();
    }
    calendarArgs['calendarId'] = calendarId || 'primary';

    var calendar = Google.calendar('v3');
    calendar.events.list(
        calendarArgs,
        function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var events = _.map(response.items, function(event) {
                return handleEvent(event);
            });
            callback(null, events);
        }
    );
}

function handleEvent(event) {
    var start = event.start.dateTime || event.start.date;
    start = Moment(start);
    var end = event.end.dateTime || event.end.date;
    end = Moment(end);

    var msg = {
        'text': 'xxx    ' + start.format('HH:mm') + '-' + end.format('HH:mm') + '   ' + event.summary,
        'timestamp': start.startOf('day').format('X'),
        'type': 'calendar'
    };

    return msg;
}
