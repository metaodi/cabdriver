/*jshint expr: true*/
var Sinon = require('sinon');
var MockFs = require('mock-fs');
var stdMocks = require('std-mocks');
var expect = require('chai').expect;

var Git = require('../lib/source/git');
var Cache = require('persistent-cache');
var NullAuth = require('../lib/auth/null_auth');

describe('Git', function() {
    afterEach(function () {
        Sinon.restore();
        MockFs.restore();
        stdMocks.restore();
    });

    describe('getCommits', function() {
        it('generates entries based on commits', function() {
            MockFs({
                '/path/to/repo/test/.git': {}
            });
            var configStub = Sinon.stub().yields(null, {
                'user': {'name': 'Test User'}
            });
            var logStub = Sinon.stub().resolves([{
                authorDate: '2017-03-29T14:45:28.000Z',
                subject: 'Test Commit'
            }]);
            var cache = Cache({'persist': false});

            var options = {
                'startDate': '2017-03-28',
                'endDate': '2017-03-30',
                'git': '/path/to/repo',
                'cache': cache,
                'verbose': true,
            };
            var auth = new NullAuth();
            var git = new Git(options, auth, logStub, configStub);
            return git.getEntries()
                .then(function(result) {
                    Sinon.assert.called(configStub);
                    Sinon.assert.called(logStub);
                    Sinon.assert.calledWith(logStub, {
                        repo: '/path/to/repo/test',
                        number: 1000,
                        author: 'Test User',
                        all: true,
                        after: '2017-03-27T21:59:59.999Z',
                        before: '2017-03-30',
                        fields: [
                            'abbrevHash',
                            'subject',
                            'authorName',
                            'authorDate'
                        ]
                    });
                    expect(result).to.deep.equal([{
                        project: 'test',
                        time: '',
                        text: 'Test Commit',
                        timestamp: '1490738400',
                        comment: false,
                        type: 'git'
                    }]);
            });
        });
        it('generates error msg for not-accessible directory', function() {
            stdMocks.use();
            MockFs({
                '/path/to/repo/test/.git': {},
                '/path/to/unreadable': MockFs.directory({
                    mode: parseInt('0000', 8),
                    uid: 0,
                    gid: 0,
                    items: {
                        'readable-child': MockFs.file({
                            mode: parseInt('0777', 8),
                            content: 'read, write, and execute'
                         })
                    }
                })
            });
            var configStub = Sinon.stub().yields(null, {
                'user': {'name': 'Test User'}
            });
            var logStub = Sinon.stub().resolves([{
                authorDate: '2017-03-29T14:45:28.000Z',
                subject: 'Test Commit'
            }]);
            var cache = Cache({'persist': false});

            var options = {
                'startDate': '2017-03-28',
                'endDate': '2017-03-30',
                'git': '/path/to/',
                'verbose': true,
                'cache': cache
            };
            var auth = new NullAuth();
            var git = new Git(options, auth, logStub, configStub);
            git.getEntries()
                .then(function(result) {
                    var output = stdMocks.flush().stderr;
                    expect(output).to.deep.equal(
                        ["Error accessing path /path/to/unreadable/readable-child\n"]
                    );
            });
        });
        it('generates entries based on cached paths', function() {
            MockFs({
                '/path/to/repo/test-not-in-cache/.git': {},
                '/path/to/repo/test-in-cache/.git': {}
            });
            var configStub = Sinon.stub().yields(null, {
                'user': {'name': 'Test User'}
            });
            var logStub = Sinon.stub().resolves([{
                authorDate: '2017-03-29T14:45:28.000Z',
                subject: 'Test Commit'
            }]);
            var cache = Cache({'persist': false});
            cache.putSync('git-repo-paths', ['/path/to/repo/test-in-cache']);

            var options = {
                'startDate': '2017-03-28',
                'endDate': '2017-03-30',
                'git': '/path/to/repo',
                'cache': cache
            };
            var auth = new NullAuth();
            var git = new Git(options, auth, logStub, configStub);
            return git.getEntries()
                .then(function(result) {
                    Sinon.assert.called(configStub);
                    Sinon.assert.called(logStub);
                    Sinon.assert.calledWith(logStub, {
                        repo: '/path/to/repo/test-in-cache',
                        number: 1000,
                        author: 'Test User',
                        all: true,
                        after: '2017-03-27T21:59:59.999Z',
                        before: '2017-03-30',
                        fields: [
                            'abbrevHash',
                            'subject',
                            'authorName',
                            'authorDate'
                        ]
                    });
                    expect(result).to.deep.equal([{
                        project: 'test-in-cache',
                        time: '',
                        text: 'Test Commit',
                        timestamp: '1490738400',
                        comment: false,
                        type: 'git'
                    }]);
            });
        });
    });
});
