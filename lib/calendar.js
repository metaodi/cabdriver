var Google = require('googleapis');
var Moment = require('moment');

exports.listEvents = listEvents

/**
 * Lists events based of the given parameters
 */
function listEvents(auth, count, startDate, endDate, calendarId) {
  var calendarArgs = {
      auth: auth,
      singleEvents: true,
      orderBy: 'startTime'
  }
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
        var events = response.items;
        if (events.length == 0) {
            console.log('No upcoming events found.');
        } else {
            currentDay = '';
            for (var i = 0; i < events.length; i++) {
                var event = events[i];

                var start = event.start.dateTime || event.start.date;
                var day = Moment(start);
                start = Moment(start).format('HH:mm');
                var end = event.end.dateTime || event.end.date;
                end = Moment(end).format('HH:mm');

                if (day.format('DD.MM.YYYY') !== currentDay) {
                    console.log('');
                    console.log('%s # %s', day.format('DD/MM/YYYY'), day.format('dddd'))
                    currentDay = day.format('DD.MM.YYYY');
                }

                console.log('xxx    %s-%s   %s', start, end, event.summary);
            }
        }
    }
  );
}
