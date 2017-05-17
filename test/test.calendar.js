/*jshint expr: true*/
var Sinon = require('sinon');
var expect = require('chai').expect;

var calendar = require('../lib/calendar');
var Google = require('googleapis');

var sandbox = Sinon.sandbox.create();

describe('Calendar', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('listEvents', function() {
        it('sets the args correctly without endDate', function() {
            var callback = sandbox.spy();
            var listStub = sandbox.stub();
            var googleStub = sandbox.stub(Google, 'calendar').returns({'events': {'list': listStub}});
            
            var options = {
                'count': 11,
                'startDate': '2017-05-17',
                'calendar': 'events'
            };
            calendar.listEvents(callback, '1234', options);
            Sinon.assert.calledWith(listStub, {
                auth: "1234",
                calendarId: "events",
                maxResults: 11,
                orderBy: "startTime",
                singleEvents: true,
                timeMin: "2017-05-17"
            });
        });
        it('sets the args correctly with endDate', function() {
            var callback = sandbox.spy();
            var listStub = sandbox.stub();
            var googleStub = sandbox.stub(Google, 'calendar').returns({'events': {'list': listStub}});
            
            var options = {
                'count': 11,
                'startDate': '2017-05-17',
                'endDate': '2017-05-18',
                'calendar': 'events'
            };
            calendar.listEvents(callback, '1234', options);
            Sinon.assert.calledWith(listStub, {
                auth: "1234",
                calendarId: "events",
                maxResults: 11,
                orderBy: "startTime",
                singleEvents: true,
                timeMin: "2017-05-17",
                timeMax: "2017-05-18T22:00:00.000Z"
            });
        });
        it('returns the correct msgs with hour option', function() {        //setup stubs
            var callback = sandbox.spy();
            var listStub = sandbox.stub().yields(
                null,
                {
                    'items': [
                        {
                            'start': {'dateTime': '2017-05-17T13:45:00Z'},
                            'end': {'dateTime': '2017-05-17T14:00:00Z'},
                            'summary': 'Test Event',
                        }
                    ]
                }
            );
            var googleStub = sandbox.stub(Google, 'calendar').returns({'events': {'list': listStub}});
            
            var options = {
                'count': 11,
                'startDate': '2017-05-17',
                'calendar': 'events',
                'hours': true
            };
            calendar.listEvents(callback, '1234', options);
            var msg = {
                'project': 'xxx',
                'time': '0.25',
                'text': 'Test Event',
                'timestamp': "1494972000",
                'comment': false,
                'type': 'calendar'
            };
            Sinon.assert.calledWith(callback, null, [msg]);
        });
        it('returns the correct msgs without hour option', function() {        //setup stubs
            var callback = sandbox.spy();
            var listStub = sandbox.stub().yields(
                null,
                {
                    'items': [
                        {
                            'start': {'dateTime': '2017-05-17T13:45:00Z'},
                            'end': {'dateTime': '2017-05-17T14:00:00Z'},
                            'summary': 'Test Event',
                        }
                    ]
                }
            );
            var googleStub = sandbox.stub(Google, 'calendar').returns({'events': {'list': listStub}});
            
            var options = {
                'count': 11,
                'startDate': '2017-05-17',
                'calendar': 'events',
            };
            calendar.listEvents(callback, '1234', options);
            var msg = {
                'project': 'xxx',
                'time': '15:45-16:00',
                'text': 'Test Event',
                'timestamp': "1494972000",
                'comment': false,
                'type': 'calendar'
            };
            Sinon.assert.calledWith(callback, null, [msg]);
        });
    });
});

