/*jshint expr: true*/
var Sinon = require('sinon');
var Nock = require('nock');
var expect = require('chai').expect;

var JiraApi = require('jira-client');

var sandbox = Sinon.sandbox.create();

var jira = require('../lib/jira');

describe('Jira', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('getActivities', function() {
        it('generates entries based on Jira history', function(done) {
            this.timeout(5000);
            var currentUserStub = sandbox.stub(JiraApi.prototype, 'getCurrentUser')
                .resolves({'key': 'testuser'});
            var searchJiraStub = sandbox.stub(JiraApi.prototype, 'searchJira')
                .resolves({'issues': [{'key': 'TEST-123'}]});
            var findIssueStub = sandbox.stub(JiraApi.prototype, 'findIssue')
                .resolves({
                    'key': 'TEST-123',
                    'changelog': {
                        'histories': [{
                            'author': {'key': 'testuser'},
                            'created': '2017-03-29'
                        }]
                    },
                    'fields': {
                        'summary': 'Test issue summary',
                        'comment': {'comments': []},
                        'worklog': {'worklogs': []}
                    }
                });


            var options = {
                'startDate': '2017-03-28',
                'endDate': '2017-03-30',
                'jira': true
            };
            var auth = {
                'consumer_key': '123',
                'consumer_secret': 'secret',
                'access_token': '1234',
                'access_token_secret': 'secret'
            };
            jira.getActivities(function(err, result) {
                try {
                    expect(err).to.not.exist;
                    expect(result).to.deep.equal([{
                        project: 'test',
                        time: '1',
                        text: 'TEST-123: Test issue summary',
                        timestamp: '1490738400',
                        type: 'jira',
                        comment: false
                    }]);
                    done();
                } catch (e) {
                    done(e);
                }
            }, auth, options);
        });
   });
});