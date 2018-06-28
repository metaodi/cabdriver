/*jshint expr: true*/
var Sinon = require('sinon');
var expect = require('chai').expect;

var Slack = require('../lib/source/slack');

var sandbox = Sinon.sandbox.create();

describe('Slack', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('getEntries', function() {
        it('returns the correct entries for public msgs', function() {
            var searchStub = sandbox.stub().resolves(
                {
                    'messages': {
                        'matches': [{
                            'ts': 1497045600000,
                            'type': 'message',
                            'channel': {'id': 'C03PL5HE8'}
                        }]
                    }
                }
            );
            var channelStub = sandbox.stub().resolves(
                {
                    'channel': {'name': 'testchannel'}
                }
            );
            var apiStub = {
                'search': {
                    'messages': searchStub
                },
                'channels': {
                    'info': channelStub
                }
            };
            var authStub = {
                'getAuth': sandbox.stub().resolves('1234')
            };
            
            var options = {
                'startDate': '2017-04-09',
                'endDate': '2017-04-11',
                'slack': true
            };
            var slack = new Slack(options, authStub, apiStub);
            return slack.getEntries()
                .then(function(result) {
                    var msg = {
                        'project': 'xxx',
                        'time': '',
                        'text': '1 messages in #testchannel',
                        'graph': { 'label': "testchannel - 1", 'value': 1 },
                        'timestamp': "1497045538800",
                        'comment': false,
                        'type': 'slack'
                    };
                    expect(result).to.deep.equal([msg]);
                });
        });
        it('returns the correct entries for private msgs', function() {
            var searchStub = sandbox.stub().resolves(
                {
                    'messages': {
                        'matches': [
                            {
                                'ts': 1497045900000,
                                'type': 'im',
                                'channel': {'id': 'I03PL5HE8'}
                            },
                            {
                                'ts': 1497045910000,
                                'type': 'im',
                                'channel': {'id': 'I03PL5HE8'}
                            }
                        ]
                    }
                }
            );
            var channelStub = sandbox.stub().resolves(
                {
                    'user': {'name': 'testuser'}
                }
            );
            var apiStub = {
                'search': {
                    'messages': searchStub
                },
                'users': {
                    'info': channelStub
                }
            };
            var authStub = {
                'getAuth': sandbox.stub().resolves('1234')
            };
            
            var options = {
                'startDate': '2017-04-09',
                'endDate': '2017-04-11',
                'slack': true
            };
            var slack = new Slack(options, authStub, apiStub);
            return slack.getEntries()
                .then(function(result) {
                    var msg = {
                        'project': 'xxx',
                        'time': '',
                        'text': '2 messages with testuser',
                        'graph': { 'label': "testuser - 2", 'value': 2 },
                        'timestamp': "1497045884400",
                        'comment': false,
                        'type': 'slack'
                    };
                    expect(result).to.deep.equal([msg]);
                });
        });
        it('generates pie based on msgs', function() {
            var searchStub = sandbox.stub().resolves(
                {
                    'messages': {
                        'matches': [{
                            'ts': 1497045600000,
                            'type': 'message',
                            'channel': {'id': 'C03PL5HE8'}
                        }]
                    }
                }
            );
            var channelStub = sandbox.stub().resolves(
                {
                    'channel': {'name': 'testchannel'}
                }
            );
            var apiStub = {
                'search': {
                    'messages': searchStub
                },
                'channels': {
                    'info': channelStub
                }
            };
            var authStub = {
                'getAuth': sandbox.stub().resolves('1234')
            };
            
            var options = {
                'startDate': '2017-04-09',
                'endDate': '2017-04-11',
                'slack': true,
                'pie': true
            };
            var slack = new Slack(options, authStub, apiStub);
            return slack.getEntries()
                .then(function(result) {
                    var entry = result[0];
                    expect(entry.timestamp).to.equal('1497045538800');
                    expect(entry.type).to.equal('slack');
                    expect(entry.raw).to.exist;
                });
        });
    });
});

