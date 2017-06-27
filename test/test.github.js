/*jshint expr: true*/
var Sinon = require('sinon');
var expect = require('chai').expect;

var github = require('../lib/github');
var GithubApi = require('github');

var sandbox = Sinon.sandbox.create();

describe('Github', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('getContributions', function() {
        it('returns the correct entry for a PullRequestEvent', function(done) {
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
                'hasNextPage': sandbox.stub().returns(false),
                'users': {'get': userStub},
                'activity': {'getEventsForUser': eventStub}
            };
            sandbox.stub(github, 'getApi').returns(apiStub);

            // call the function
            var options = {
                'startDate': '2017-06-22',
                'endDate': '2017-06-24',
                'github': true
            };
            github.getContributions(
                function(err, result) {
                    try {
                        expect(err).to.not.exist;
                        var msg = {
                            'project': 'test-repo',
                            'time': '1',
                            'text': '#1337: Test pull request, pull request created',
                            'timestamp': "1498168800",
                            'comment': false,
                            'type': 'github'
                        };
                        expect(result).to.be.deep.equal([msg]);
                        done();
                    } catch (e) {
                        done(e);
                    }
                },
                '1234',
                options
            );
        });
    });
});

