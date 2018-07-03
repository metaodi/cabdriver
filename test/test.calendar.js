/*jshint expr: true*/
var Promise = require('bluebird');
var Sinon = require('sinon');
var expect = require('chai').expect;

var GoogleCalendar = require('../lib/source/calendar');
const {google} = require('googleapis');

var sandbox = Sinon.sandbox.create();

describe('Calendar', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('generateEntries', function() {
        it('returns the correct msgs with hour option', function() {
            //setup stubs
            var listStub = sandbox.stub().resolves(
                {
                    'data': {
                        'items': [
                            {
                                'start': {'dateTime': '2017-05-17T13:45:00Z'},
                                'end': {'dateTime': '2017-05-17T14:00:00Z'},
                                'summary': 'Test Event',
                            }
                        ]
                    }
                }
            );
            var googleStub = sandbox.stub(google, 'calendar').returns({'events': {'list': listStub}});
            
            var options = {
                'count': 11,
                'startDate': '2017-05-17',
                'calendar': 'events',
                'hours': true
            };
            var authStub = {'getAuth': sandbox.stub().resolves('1234')};

            var calendar = new GoogleCalendar(options, authStub);
            return calendar.getEntries()
                .then(function(results) {
                    var msg = {
                        'project': 'xxx',
                        'time': '0.25',
                        'text': 'Test Event',
                        'timestamp': "1494972000",
                        'comment': false,
                        'type': 'calendar'
                    };
                    expect(results).to.be.deep.equal([msg]);
                });
        });
        it('returns the correct msgs without hour option', function() {
            //setup stubs
            var callback = sandbox.spy();
            var listStub = sandbox.stub().resolves(
                {
                    'data': {
                        'items': [
                            {
                                'start': {'dateTime': '2017-05-17T13:45:00Z'},
                                'end': {'dateTime': '2017-05-17T14:00:00Z'},
                                'summary': 'Test Event',
                            }
                        ]
                    }
                }
            );
            var googleStub = sandbox.stub(google, 'calendar').returns({'events': {'list': listStub}});
            
            var options = {
                'count': 11,
                'startDate': '2017-05-17',
                'calendar': 'events',
            };
            var authStub = {'getAuth': sandbox.stub().resolves('1234')};
            var calendar = new GoogleCalendar(options, authStub);

            return calendar.getEntries()
                .then(function(results) {
                    var msg = {
                        'project': 'xxx',
                        'time': '15:45-16:00',
                        'text': 'Test Event',
                        'timestamp': "1494972000",
                        'comment': false,
                        'type': 'calendar'
                    };
                    expect(results).to.be.deep.equal([msg]);
                });
        });
        it('returns the correct msgs with pagination', function() {
            //setup stubs
            var callback = sandbox.spy();
            var listStub = sandbox.stub();
            listStub.onCall(0).resolves(
                {
                    'nextPageToken': 'aaabbbcccddd',
                    'data': {
                        'items': [
                            {
                                'start': {'dateTime': '2017-05-17T13:45:00Z'},
                                'end': {'dateTime': '2017-05-17T14:00:00Z'},
                                'summary': 'Test Event',
                            }
                        ]
                    }
                }
            );
            listStub.onCall(1).resolves(
                {
                    'data': {
                        'items': [
                            {
                                'start': {'dateTime': '2017-05-17T15:45:00Z'},
                                'end': {'dateTime': '2017-05-17T16:00:00Z'},
                                'summary': 'Test Event Page 2',
                            }
                        ]
                    }
                }
            );
            var googleStub = sandbox.stub(google, 'calendar').returns({'events': {'list': listStub}});
            
            var options = {
                'count': 11,
                'startDate': '2017-05-17',
                'calendar': 'events',
            };
            var authStub = {'getAuth': sandbox.stub().resolves('1234')};
            var calendar = new GoogleCalendar(options, authStub);

            return calendar.getEntries()
                .then(function(results) {
                    var msgs = [
                        {
                            'project': 'xxx',
                            'time': '15:45-16:00',
                            'text': 'Test Event',
                            'timestamp': "1494972000",
                            'comment': false,
                            'type': 'calendar'
                        },
                        {
                            'project': 'xxx',
                            'time': '17:45-18:00',
                            'text': 'Test Event Page 2',
                            'timestamp': "1494972000",
                            'comment': false,
                            'type': 'calendar'
                        }
                    ];
                    Sinon.assert.calledWith(listStub, {
                        "auth": "1234",
                        "calendarId": "events",
                        "maxResults": 11,
                        "orderBy": "startTime",
                        "pageToken": "aaabbbcccddd",
                        "singleEvents": true,
                        "timeMin": "2017-05-16T22:00:00.000Z"
					}); 
                    expect(results).to.be.deep.equal(msgs);
                });
        });
    });
});

