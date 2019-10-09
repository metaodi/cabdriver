/*jshint expr: true*/
var Sinon = require('sinon');
var expect = require('chai').expect;
var Moment = require('moment-timezone');
var Cache = require('persistent-cache');

var Github = require('../lib/source/github');

describe('Github', function() {
    afterEach(function () {
        Sinon.restore();
    });

    describe('getEntries', function() {
        it('returns the correct entry for a PullRequestEvent', function() {
            // setup stubs  
            var userStub = Sinon.stub().resolves({
                'data': {
                    'login': 'githubtestuser'
                }
            });
            var eventStub = Sinon.stub().resolves([
                {
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
                }
            ]);
            var eventsStub = Sinon.stub().resolves({
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
                'paginate': eventStub,
                'users': {'getAuthenticated': userStub},
                'activity': {'listEventsForUser': {'endpoint': { 'merge': eventsStub}}}
            };
            var authStub = {
                'getAuth': Sinon.stub().resolves('1234')
            };
            var cache = Cache({'persist': false});

            // call the function
            var options = {
                'startDate': '2017-06-22',
                'endDate': '2017-06-24',
                'github': true,
                'cache': cache
            };
            var github = new Github(options, authStub, apiStub);
            return github.getEntries()
                .then(function(result) {
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
        it('returns the correct entry from the cache:', function() {
            // setup stubs  
            var cache = Cache({'persist': false});
            cache.putSync('github-username', 'githubcacheuser');

            var events = [{
                'actor': {
                    'login': 'githubcacheuser'
                },
                'created_at': '2018-08-28',
                'repo': {
                    'name': 'githubcacheuser/cache-repo'
                },
                'type': 'PullRequestEvent',
                'payload': {
                    'action': 'created',
                    'pull_request': {
                        'number': '1338',
                        'title': 'Test pull request'
                    }
                }
            }];
            cache.putSync('github-events', events);

            var apiStub = { 
                'activity': {'listEventsForUser': {'endpoint': { 'merge': Sinon.stub()}}}
            };
            var authStub = {
                'getAuth': Sinon.stub().resolves('1234')
            };

            // call the function
            var options = {
                'startDate': '2018-08-25',
                'endDate': '2018-08-29',
                'github': true,
                'cache': cache
            };
            var github = new Github(options, authStub, apiStub);
            return github.getEntries()
                .then(function(result) {
                    var msg = {
                        'project': 'cache-repo',
                        'time': '1',
                        'text': '#1338: Test pull request, pull request created',
                        'timestamp': "1535407200",
                        'comment': false,
                        'type': 'github'
                    };
                    expect(result).to.be.deep.equal([msg]);
                });
        });
    });
});

