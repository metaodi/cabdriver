/*jshint expr: true*/
var Promise = require('bluebird');
var Sinon = require('sinon');
var expect = require('chai').expect;

var GoogleCalendar = require('../lib/calendar');
var Google = require('googleapis');

var sandbox = Sinon.sandbox.create();

describe('Calendar', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('generateEntries', function() {
        it('returns the correct msgs with hour option', function() {        //setup stubs
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
    });
});

