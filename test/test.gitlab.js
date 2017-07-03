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
        it('generates entry based on GitLab push event', function(done) {
            Nock('https://gitlab.liip.ch')
                .get('/api/v3/events')
                .query(true)
                .reply(200, [{
                    'target_type': null,
                    'target_id': null,
                    'project_id': null,
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
        it('generates entry based on GitLab note event', function(done) {
            Nock('https://gitlab.liip.ch')
                .get('/api/v3/events')
                .query(true)
                .reply(200, [{
                    'target_type': 'Note',
                    'target_id': '1234',
                    'target_title': 'Test target title',
                    'note': {
                        'noteable_type': 'MergeRequest',
                        'noteable_id': '4321'
                    },
                    'project_id': '5678',
                    'action_name': 'commented on',
                    'data': {'ref': 'refs/heads/master'},
                    'created_at': '2017-03-29'
                }], {'x-next-page': ''});
            Nock('https://gitlab.liip.ch')
                .get('/api/v3/projects/5678')
                .query(true)
                .reply(200, {
                    'name': 'testproject',
                });
            Nock('https://gitlab.liip.ch')
                .get('/api/v3/projects/5678/merge_requests/4321')
                .query(true)
                .reply(200, {
                    'iid': '42',
                    'title': 'Test merge request'
                });


            var options = {
                'startDate': '2017-03-28',
                'endDate': '2017-03-30',
                'gitlab': true
            };
            gitlab.getEvents(function(err, result) {
                try {
                    expect(err).to.not.exist;
                    expect(result).to.deep.equal([{
                        project: 'testproject',
                        time: '1',
                        text: '!42: Test target title, commented on merge request',
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

