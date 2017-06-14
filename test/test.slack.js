/*jshint expr: true*/
var Sinon = require('sinon');
var expect = require('chai').expect;

var slack = require('../lib/slack');
var SlackApi = require('slack-api');

var sandbox = Sinon.sandbox.create();

describe('Slack', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('dailyStats', function() {
        it('returns the correct msgs', function() {
            var callback = sandbox.spy();
            var searchStub = sandbox.stub(SlackApi.search, 'messages').yields(
                null,
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
            var channelStub = sandbox.stub(SlackApi.channels, 'info').yields(
                null,
                {
                    'channel': {'name': 'testchannel'}
                }
            );
            
            var options = {
                'startDate': '2017-04-09',
                'endDate': '2017-04-11',
                'slack': true
            };
            slack.dailyStats(callback, '1234', options);
            var msg = {
                'project': 'xxx',
                'time': '',
                'text': '1 messages in #testchannel',
                'graph': { 'label': "testchannel - 1", 'value': 1 },
                'timestamp': "1497045538800",
                'comment': false,
                'type': 'slack'
            };
            Sinon.assert.calledWith(callback, null, [msg]);
        });
        it('generates pie based on msgs', function(done) {
            var searchStub = sandbox.stub(SlackApi.search, 'messages').yields(
                null,
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
            var channelStub = sandbox.stub(SlackApi.channels, 'info').yields(
                null,
                {
                    'channel': {'name': 'testchannel'}
                }
            );
            
            var options = {
                'startDate': '2017-04-09',
                'endDate': '2017-04-11',
                'slack': true,
                'pie': true
            };
            slack.dailyStats(function(err, result) {
                try {
                    var entry = result[0];
                    expect(err).to.not.exist;
                    expect(entry.timestamp).to.equal('1497045538800');
                    expect(entry.type).to.equal('slack');
                    expect(entry.raw).to.exist;
                    done();
                } catch (e) {
                    done(e);
                }
            }, '1234', options);
        });
    });
});

