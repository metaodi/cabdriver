/*jshint expr: true*/
var Sinon = require('sinon');
var Nock = require('nock');
var expect = require('chai').expect;

var sandbox = Sinon.sandbox.create();

var gitlab = require('../lib/gitlab');

describe('Gitlab', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('getEvents', function() {
        it('generates entries based on GitLab events', function(done) {
            Nock('https://gitlab.liip.ch')
                .get('/api/v3/events')
                .query(true)
                .reply(200, [{
                    'action_name': 'pushed to',
                    'data': {'ref': 'refs/heads/master'},
                    'created_at': '2017-03-29'
                }], {'x-next-page': ''});


            var options = {
                'startDate': '2017-03-28',
                'endDate': '2017-03-30',
                'gitlab': true
            };
            gitlab.getEvents(function(err, result) {
                try {
                    expect(err).to.not.exist;
                    expect(result).to.deep.equal([{
                        project: 'xxx',
                        time: '1',
                        text: 'pushed to branch master',
                        timestamp: '1490738400',
                        type: 'gitlab',
                        comment: false
                    }]);
                    done();
               } catch (e) {
                   done(e);
               }
            }, '1234', options);
        });
    });
});

