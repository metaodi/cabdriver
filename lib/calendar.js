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
                callback('The Google Calendar API returned an error: ' + err);
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
        'project': 'xxx',
        'time': start.format('HH:mm') + '-' + end.format('HH:mm'),
        'text': event.summary,
        'timestamp': start.startOf('day').format('X'),
        'comment': false,
        'type': 'calendar'
    };
    
    // check my response to event (accepted/tentative/declined)
    if (_.has(event, 'attendees')) {
        var selfResponse = _.find(event.attendees, function(attendee) {
            return _.has(attendee, 'self') && attendee.self;
        });
        if (selfResponse && _.contains(['tentative', 'declined'], selfResponse.responseStatus)) {
            msg.comment = true;
            msg.text = msg.text + ' ('+ selfResponse.responseStatus.toUpperCase() + ')';
        }
    }

    return msg;
}
