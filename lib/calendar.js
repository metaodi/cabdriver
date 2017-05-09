var Google = require('googleapis');
var Moment = require('moment-timezone');
require('twix');
var _ = require('lodash');

exports.listEvents = listEvents;

/**
 * Lists events based of the given parameters
 */
function listEvents(callback, auth, options) {
    var calendarArgs = {
        auth: auth,
        singleEvents: true,
        orderBy: 'startTime'
    };
    calendarArgs['maxResults'] = options.count || 10;
    calendarArgs['timeMin'] = options.startDate || (new Date()).toISOString();
    if (options.endDate) {
        calendarArgs['timeMax'] = Moment.tz(options.endDate, 'Europe/Zurich').add(1, 'd').startOf('day').toISOString();
    }
    calendarArgs['calendarId'] = options.calendar || 'primary';

    var calendar = Google.calendar('v3');
    calendar.events.list(
        calendarArgs,
        function(err, response) {
            if (err) {
                callback('The Google Calendar API returned an error: ' + err);
                return;
            }
            var events = _.map(response.items, function(event) {
                return handleEvent(event, options.hours);
            });
            callback(null, events);
        }
    );
}

function handleEvent(event, hours) {
    var start = event.start.dateTime || event.start.date;
    start = Moment(start);
    var end = event.end.dateTime || event.end.date;
    end = Moment(end);

    var time;
    if (hours) {
        var length = start.twix(end).length("hours", true);
        time = (Math.round(length * 100) / 100).toString();
    } else {
        time = start.format('HH:mm') + '-' + end.format('HH:mm');
    }

    var msg = {
        'project': 'xxx',
        'time': time,
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
        if (selfResponse && _.includes(['tentative', 'declined'], selfResponse.responseStatus)) {
            msg.comment = true;
            msg.text = msg.text + ' ('+ selfResponse.responseStatus.toUpperCase() + ')';
        }
    }

    return msg;
}
