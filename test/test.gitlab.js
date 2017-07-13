/*jshint expr: true*/
var Sinon = require('sinon');
var Nock = require('nock');
var expect = require('chai').expect;

var Gitlab = require('../lib/gitlab');

var sandbox = Sinon.sandbox.create();

describe('Gitlab', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('generateEntries', function() {
        it('generates entry based on GitLab push event', function() {
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
            var authStub = {getAuth: sandbox.stub().resolves('1234')};
            var gitlab = new Gitlab(options, authStub);
            return gitlab.getEntries()
                .then(function(entries) {
                    expect(entries).to.deep.equal([{
                        project: 'xxx',
                        time: '1',
                        text: 'pushed to branch master',
                        timestamp: '1490738400',
                        type: 'gitlab',
                        comment: false
                    }]);
                });
        });
        it('generates entry based on GitLab note event', function() {
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
            var authStub = {getAuth: sandbox.stub().resolves('1234')};
            var gitlab = new Gitlab(options, authStub);
            return gitlab.getEntries()
                .then(function(result) {
                    expect(result).to.deep.equal([{
                        project: 'testproject',
                        time: '1',
                        text: '!42: Test target title, commented on merge request',
                        timestamp: '1490738400',
                        type: 'gitlab',
                        comment: false
                    }]);
                });
        });
    });
});

