/*jshint expr: true*/
var Sinon = require('sinon');
var expect = require('chai').expect;

var github = require('../lib/github');
var GithubApi = require('github-api');

var sandbox = Sinon.sandbox.create();

describe('Github', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('getContributions', function() {
        it('returns the correct entry for a created issue', function(done) {
            // setup stubs
            var userStub = {
                'getProfile': sandbox.stub().resolves(
                    {'data': {'login': 'githubtestuser'}}
                )
            };
            var searchStub = {
                'forIssues': sandbox.stub().resolves(
                    {
                        'data': [
                            {
                                'repository_url': 'https://github.com/metaodi/cabdriver',
                                'number': '1337',
                                'created_at': '2017-06-23',
                                'title': 'Test github issue',
                                'user': {'login': 'githubtestuser'}
                            }
                        ]
                    })
            };
            var issuesStub = {
                'listIssueComments': sandbox.stub().resolves([]),
                'listIssueEvents': sandbox.stub().resolves([])
            };
            var githubStub = {
                'getUser': sandbox.stub().returns(userStub),
                'search': sandbox.stub().returns(searchStub),
                'getIssues': sandbox.stub().returns(issuesStub)
            };
            var apiStub = sandbox.stub(github, 'getApi').returns(githubStub)
            
            // call the function
            var options = {
                'startDate': '2017-06-22',
                'endDate': '2017-06-24',
                'github': true
            };
            github.getContributions(
                function(err, result) {
                    expect(err).to.not.exist;
                    var msg = {
                        'project': 'cabdriver',
                        'time': '1',
                        'text': '#1337: Test github issue',
                        'timestamp': "1498168800",
                        'comment': false,
                        'type': 'github'
                    };
                    expect(result).to.be.deep.equal([msg]);
                    done();
                },
                '1234',
                options
            );
        });
    });
});

