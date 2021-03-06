/*global describe it afterEach*/
var Sinon = require('sinon');
var Nock = require('nock');
var stdMocks = require('std-mocks');
var expect = require('chai').expect;

var JiraApi = require('jira-client');

var Jira = require('../lib/source/jira');

describe('Jira', function() {
    afterEach(function () {
        Sinon.restore();
        stdMocks.restore();
    });

    describe('getEntries', function() {
        it('generates entries based on Jira history', function() {
            var currentUserStub = Sinon.stub(JiraApi.prototype, 'getCurrentUser')
                .resolves({'key': 'testuser'});
            var searchJiraStub = Sinon.stub(JiraApi.prototype, 'searchJira')
                .resolves({'issues': [{'key': 'TEST-123'}]});
            var findIssueStub = Sinon.stub(JiraApi.prototype, 'findIssue')
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
            var authStub = {
                'getAuth': Sinon.stub().resolves(auth)
            };
            var jira = new Jira(options, authStub);
            return jira.getEntries()
                .then(function(result) {
                    expect(result).to.deep.equal([{
                        project: 'test',
                        time: '1',
                        text: 'TEST-123: Test issue summary',
                        timestamp: '1490738400',
                        type: 'jira',
                        comment: false
                    }]);
                });
        });
        it('generates entries based on Jira comments', function() {
            var currentUserStub = Sinon.stub(JiraApi.prototype, 'getCurrentUser')
                .resolves({'key': 'testuser'});
            var searchJiraStub = Sinon.stub(JiraApi.prototype, 'searchJira')
                .resolves({'issues': [{'key': 'TEST-124'}]});
            var findIssueStub = Sinon.stub(JiraApi.prototype, 'findIssue')
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
            var authStub = {
                'getAuth': Sinon.stub().resolves(auth)
            };
            var jira = new Jira(options, authStub);
            return jira.getEntries()
                .then(function(result) {
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
                });
        });
        it('generates entries based on Jira worklog', function() {
            var currentUserStub = Sinon.stub(JiraApi.prototype, 'getCurrentUser')
                .resolves({'key': 'testuser'});
            var searchJiraStub = Sinon.stub(JiraApi.prototype, 'searchJira')
                .resolves({'issues': [{'key': 'TEST-124'}]});
            var findIssueStub = Sinon.stub(JiraApi.prototype, 'findIssue')
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
            var authStub = {
                'getAuth': Sinon.stub().resolves(auth)
            };
            var jira = new Jira(options, authStub);
            return jira.getEntries()
                .then(function(result) {
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
                });
        });
        it('returns nice error message if JIRA fails', function() {
            var currentUserStub = Sinon.stub(JiraApi.prototype, 'getCurrentUser')
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
            var authStub = {
                'getAuth': Sinon.stub().resolves(auth)
            };
            var jira = new Jira(options, authStub);
            return jira.getEntries()
                .then(function(result) {
                    throw new Error('we should never get here');
                })
                .catch(function(err) {
                    expect(err.message).to.equal('The JIRA API returned an error: 500 - {"errorMessages":["Internal server error"],"errors":{}}');
                });
        });
        it('generate entries for successful issue requests, print error otherwise', function() {
            stdMocks.use();
            var currentUserStub = Sinon.stub(JiraApi.prototype, 'getCurrentUser')
                .resolves({'key': 'testuser'});
            var searchJiraStub = Sinon.stub(JiraApi.prototype, 'searchJira')
                .resolves({'issues': [{'key': 'TEST-124'},{'key': 'FAIL-666'}]});
            var findIssueStub = Sinon.stub(JiraApi.prototype, 'findIssue')
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
            var authStub = {
                'getAuth': Sinon.stub().resolves(auth)
            };
            var jira = new Jira(options, authStub);
            return jira.getEntries()
                .then(function(result) {
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
                    expect(output).to.deep.equal(['Error fetching issue FAIL-666: 500 - {"errorMessages":["Internal server error"],"errors":{}}' + '\n']);
                });
        });
    });
});
