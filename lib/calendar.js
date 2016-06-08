var Google = require('googleapis');
var Moment = require('moment');
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
        calendarArgs['timeMax'] = endDate;
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
    start = Moment(start).format('HH:mm');
    var end = event.end.dateTime || event.end.date;
    end = Moment(end).format('HH:mm');

    return 'xxx    ' + start + '-' + end + '   ' + event.summary;
}
