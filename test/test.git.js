/*jshint expr: true*/
var Sinon = require('sinon');
var MockFs = require('mock-fs');
var expect = require('chai').expect;

var sandbox = Sinon.sandbox.create();

var git = require('../lib/git');

describe('Git', function() {
    beforeEach(function () {
		MockFs({
		  '/path/to/repo/test/.git': {}
		});
	});
    afterEach(function () {
        sandbox.restore();
        MockFs.restore();
    });

    describe('getCommits', function() {
        it('generates entries based on commits', function(done) {
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
    });
});

