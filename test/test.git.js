/*jshint expr: true*/
var Sinon = require('sinon');
var MockFs = require('mock-fs');
var stdMocks = require('std-mocks');
var expect = require('chai').expect;

var sandbox = Sinon.sandbox.create();

var git = require('../lib/git');

describe('Git', function() {
    afterEach(function () {
        sandbox.restore();
        MockFs.restore();
        stdMocks.restore();
    });

    describe('getCommits', function() {
        it('generates entries based on commits', function(done) {
            MockFs({
                '/path/to/repo/test/.git': {}
            });
            var configStub = sandbox.stub(git, 'getConfig').yields(null, {
                'user': {'name': 'Test User'}
            });
            var logStub = sandbox.stub(git, 'getLog').yields(null, [{
                authorDate: '2017-03-29T14:45:28.000Z',
                subject: 'Test Commit'
            }]);

            var options = {
                'startDate': '2017-03-28',
                'endDate': '2017-03-30',
                'git': '/path/to/repo'
            };
            git.getCommits(function(err, result) {
                Sinon.assert.called(configStub);
                Sinon.assert.called(logStub);
                Sinon.assert.calledWith(logStub, {
                    repo: '/path/to/repo/test',
                    number: 1000,
                    author: 'Test User',
                    all: true,
                    after: '2017-03-28',
                    before: '2017-03-30',
                    fields: [
                        'abbrevHash',
                        'subject',
                        'authorName',
                        'authorDate'
                    ],
                    execOptions: {
                        maxBuffer: 1024000
                    }
                });
                expect(result).to.deep.equal([{
                    project: 'test',
                    time: '',
                    text: 'Test Commit',
                    timestamp: '1490738400',
                    comment: false,
                    type: 'git'
                }]);
                done();
            }, options);
        });
        it('generates error msg for not-accessible directory', function(done) {
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
            var configStub = sandbox.stub(git, 'getConfig').yields(null, {
                'user': {'name': 'Test User'}
            });
            var logStub = sandbox.stub(git, 'getLog').yields(null, [{
                authorDate: '2017-03-29T14:45:28.000Z',
                subject: 'Test Commit'
            }]);

            var options = {
                'startDate': '2017-03-28',
                'endDate': '2017-03-30',
                'git': '/path/to/',
                'verbose': true
            };
            git.getCommits(function(err, result) {
                try {
                    expect(err).to.not.exist;

                    var output = stdMocks.flush().stderr;
                    expect(output).to.deep.equal(
                        ["Error accessing path /path/to/unreadable/readable-child\n"]
                    );
                    done();
                } catch (e) {
                    done(e);
                }
            }, options);
        });
    });
});
