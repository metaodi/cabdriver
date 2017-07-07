var Google = require('googleapis');
var Moment = require('moment-timezone');
var _ = require('lodash');
var Promise = require('bluebird');

var Source = require('./source');

class GoogleCalendar extends Source {
    constructor(auth, options) {
        super(auth, options);
        this.type = 'calendar';
    }

    generateEntries(auth) {
        var me = this;
        var calendarArgs = {
            auth: auth,
            singleEvents: true,
            orderBy: 'startTime'
        };
        calendarArgs['maxResults'] = me.options.count || 10;
        calendarArgs['timeMin'] = me.options.startDate || (new Date()).toISOString();
        if (me.options.endDate) {
            calendarArgs['timeMax'] = Moment.tz(me.options.endDate, 'Europe/Zurich').add(1, 'd').startOf('day').toISOString();
        }
        if (me.options.calendar === true) {
            me.options.calendar = 'primary';
        }
        calendarArgs['calendarId'] = me.options.calendar || 'primary';

        var calendar = Google.calendar('v3');
        var eventsList = Promise.promisify(calendar.events.list, {context: calendar.events});
        return eventsList(calendarArgs)
            .then(function(response) {
                var events = _.map(response.items, function(event) {
                    return me.handleEvent(event, me.options.hours);
                });
                return events;
            })
            .catch(function(err) {
                throw new Error('The Google Calendar API returned an error: ' + err);
            });
    }

    handleEvent(event, hours) {
        var start = event.start.dateTime || event.start.date;
        start = Moment.tz(start, 'Europe/Zurich');
        var end = event.end.dateTime || event.end.date;
        end = Moment.tz(end, 'Europe/Zurich');

        var time;
        if (hours) {
            time = (Math.round(end.diff(start, "hours", true) * 100) / 100).toString();
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
}

module.exports = GoogleCalendar;
