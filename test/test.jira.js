/*jshint expr: true*/
var Sinon = require('sinon');
var Nock = require('nock');
var stdMocks = require('std-mocks');
var expect = require('chai').expect;

var JiraApi = require('jira-client');

var sandbox = Sinon.sandbox.create();

var jira = require('../lib/jira');

describe('Jira', function() {
    afterEach(function () {
        sandbox.restore();
        stdMocks.restore();
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
        it('generates entries based on Jira comments', function(done) {
            var currentUserStub = sandbox.stub(JiraApi.prototype, 'getCurrentUser')
                .resolves({'key': 'testuser'});
            var searchJiraStub = sandbox.stub(JiraApi.prototype, 'searchJira')
                .resolves({'issues': [{'key': 'TEST-124'}]});
            var findIssueStub = sandbox.stub(JiraApi.prototype, 'findIssue')
                .resolves({
                    'key': 'TEST-123',
                    'changelog': {
                        'histories': [{
                            'author': {'key': 'anotheruser'},
                            'created': '2017-03-22'
                        }]
                    },
                    'fields': {
                        'summary': 'Test issue summary',
                        'comment': {'comments': [
                            {
                                'created': '2017-03-29',
                                'author': {'key': 'anotheruser'}
                            },
                            {
                                'created': '2017-03-29',
                                'author': {'key': 'testuser'}
                            },
                            {
                                'created': '2017-03-31',
                                'author': {'key': 'testuser'}
                            }
                        ]},
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
                    expect(result).to.deep.equal([
                        {
                            project: 'test',
                            time: '1',
                            text: 'TEST-123: Test issue summary',
                            timestamp: '1490738400',
                            type: 'jira',
                            comment: false
                        }
                    ]);
                    done();
                } catch (e) {
                    done(e);
                }
            }, auth, options);
        });
        it('generates entries based on Jira worklog', function(done) {
            var currentUserStub = sandbox.stub(JiraApi.prototype, 'getCurrentUser')
                .resolves({'key': 'testuser'});
            var searchJiraStub = sandbox.stub(JiraApi.prototype, 'searchJira')
                .resolves({'issues': [{'key': 'TEST-124'}]});
            var findIssueStub = sandbox.stub(JiraApi.prototype, 'findIssue')
                .resolves({
                    'key': 'TEST-123',
                    'changelog': {
                        'histories': [{
                            'author': {'key': 'anotheruser'},
                            'created': '2017-03-22'
                        }]
                    },
                    'fields': {
                        'summary': 'Test issue summary',
                        'comment': {'comments': []},
                        'worklog': {'worklogs': [
                            {
                                'started': '2017-03-29',
                                'author': {'key': 'testuser'},
                                'timeSpentSeconds': 7200,
                                'comment': 'Problem analysis'
                            }
                        ]}
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
                    expect(result).to.deep.equal([
                        {
                            project: 'test',
                            time: '2',
                            text: 'TEST-123 worklog: Problem analysis',
                            timestamp: '1490738400',
                            type: 'jira',
                            comment: false
                        }
                    ]);
                    done();
                } catch (e) {
                    done(e);
                }
            }, auth, options);
        });
        it('returns nice error message if JIRA fails', function(done) {
            var currentUserStub = sandbox.stub(JiraApi.prototype, 'getCurrentUser')
                .rejects({
                    'name': 'StatusCodeError',
                    'statusCode': 500,
                    'message': '500 - {"errorMessages":["Internal server error"],"errors":{}}'
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
                    expect(err).to.equal('The JIRA API returned an error: 500 - {"errorMessages":["Internal server error"],"errors":{}}');
                    done();
                } catch (e) {
                    done(e);
                }
            }, auth, options);
        });
        it('generate entries for successful issue requests, print error otherwise', function(done) {
            stdMocks.use();
            var currentUserStub = sandbox.stub(JiraApi.prototype, 'getCurrentUser')
                .resolves({'key': 'testuser'});
            var searchJiraStub = sandbox.stub(JiraApi.prototype, 'searchJira')
                .resolves({'issues': [{'key': 'TEST-124'},{'key': 'FAIL-666'}]});
            var findIssueStub = sandbox.stub(JiraApi.prototype, 'findIssue')
                .onFirstCall().resolves({
                    'key': 'TEST-123',
                    'changelog': {
                        'histories': [{
                            'author': {'key': 'anotheruser'},
                            'created': '2017-03-22'
                        }]
                    },
                    'fields': {
                        'summary': 'Test issue summary',
                        'comment': {'comments': []},
                        'worklog': {'worklogs': [
                            {
                                'started': '2017-03-29',
                                'author': {'key': 'testuser'},
                                'timeSpentSeconds': 7200,
                                'comment': 'Problem analysis'
                            }
                        ]}
                    }
                })
                .onSecondCall().rejects({
                    'name': 'StatusCodeError',
                    'statusCode': 500,
                    'message': '500 - {"errorMessages":["Internal server error"],"errors":{}}'
                });

            var options = {
                'startDate': '2017-03-28',
                'endDate': '2017-03-30',
                'jira': true,
                'verbose': true
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
                    expect(result).to.deep.equal([
                        {
                            project: 'test',
                            time: '2',
                            text: 'TEST-123 worklog: Problem analysis',
                            timestamp: '1490738400',
                            type: 'jira',
                            comment: false
                        }
                    ]);
                    var output = stdMocks.flush().stderr;
                    stdMocks.restore();
                    expect(output).to.deep.equal(['Error fetching issue FAIL-666: 500 - {"errorMessages":["Internal server error"],"errors":{}}' + "\n"]);
                    done();
                } catch (e) {
                    done(e);
                }
            }, auth, options);
        });
   });
});
