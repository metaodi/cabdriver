/*jshint expr: true*/
var Sinon = require('sinon');
var expect = require('chai').expect;

var Github = require('../lib/github');
var GithubApi = require('github');

var sandbox = Sinon.sandbox.create();

describe('Github', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('getEntries', function() {
        it('returns the correct entry for a PullRequestEvent', function() {
            // setup stubs  
            var userStub = sandbox.stub().resolves({
                'data': {
                    'login': 'githubtestuser'
                }
            });
            var eventStub = sandbox.stub().resolves({
                'data': [{
                    'actor': {
                        'login': 'githubtestuser'
                    },
                    'created_at': '2017-06-23',
                    'repo': {
                        'name': 'githubtestuser/test-repo'
                    },
                    'type': 'PullRequestEvent',
                    'payload': {
                        'action': 'created',
                        'pull_request': {
                            'number': '1337',
                            'title': 'Test pull request'
                        }
                    }
                }]
            });
            var apiStub = { 
                'authenticate': sandbox.stub(),
                'hasNextPage': sandbox.stub().returns(false),
                'users': {'get': userStub},
                'activity': {'getEventsForUser': eventStub}
            };
            var authStub = {
                'getAuth': sandbox.stub().resolves('1234')
            };

            // call the function
            var options = {
                'startDate': '2017-06-22',
                'endDate': '2017-06-24',
                'github': true
            };
            var github = new Github(options, authStub, apiStub);
            return github.getEntries()
                .then(function(result) {
                    Sinon.assert.calledWith(
                        apiStub.authenticate,
                        {
                            type: 'oauth',
                            token: '1234'
                        }
                    );
                    var msg = {
                        'project': 'test-repo',
                        'time': '1',
                        'text': '#1337: Test pull request, pull request created',
                        'timestamp': "1498168800",
                        'comment': false,
                        'type': 'github'
                    };
                    expect(result).to.be.deep.equal([msg]);
                });
        });
    });
});

