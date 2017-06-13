/*jshint expr: true*/
var Sinon = require('sinon');
var stdMocks = require('std-mocks');
var expect = require('chai').expect;

var auth = require('../lib/auth');
var calendar = require('../lib/calendar');
var cli = require('../lib/cli');

var sandbox = Sinon.sandbox.create();

describe('CLI', function() {
    afterEach(function () {
        sandbox.restore();
        stdMocks.restore();
    });

    describe('querySources', function() {
        describe('Calendar option', function() {
            it('should call Google Calendar', function(done) {
                //setup stubs
                var expectedMsg = {
                    'project': 'xxx',
                    'time': '1',
                    'text': 'Test Entry',
                    'timestamp': 0,
                    'comment': false,
                    'type': 'calendar'
                };
                var authStub = sandbox.stub(auth, 'getAuth').yields({"auth": 123});
                var calStub = sandbox.stub(calendar, 'listEvents').yields(null, [expectedMsg]);

                var options = {'calendar': 'primary'};
                cli.querySources(options, function(err, results) {
                    expect(err).to.not.exist;
                    expect(results).to.be.deep.equal([expectedMsg]);
                    done();
                });
            });
            it('should use the primary calendar if none is specified', function(done) {
                //setup stubs
                var expectedMsg = {
                    'project': 'xxx',
                    'time': '1',
                    'text': 'Test Entry',
                    'timestamp': 0,
                    'comment': false,
                    'type': 'calendar'
                };
                var authStub = sandbox.stub(auth, 'getAuth').yields({"auth": 123});
                var calStub = sandbox.stub(calendar, 'listEvents').yields(null, [expectedMsg]);

                var options = {'calendar': true};
                cli.querySources(options, function(err, results) {
                    expect(err).to.not.exist;
                    expect(results).to.be.deep.equal([expectedMsg]);
                    expect(calStub.firstCall.args[2]).to.deep.equal({'calendar': 'primary'});
                    done();
                });
            });
        });
    });
    describe('printResults', function() {
        it('should print a correct calendar taxi entry', function() {
            //setup stubs
            stdMocks.use();

            var msg = {
                'project': 'xxx',
                'time': '1',
                'text': 'Test Entry',
                'timestamp': 123,
                'comment': false,
                'type': 'calendar'
            };
            cli.printResults([msg]);
            var output = stdMocks.flush().stdout;
            stdMocks.restore();
            var expectedOutput = [
                "\n",
                "\n",
                "01/01/1970 # Thursday\n",
                "\n",
                "# calendar",
                " (Total: 1.00h)",
                "\n",
                "#------------------\n",
                "xxx  1 Test Entry\n"
            ];
            expect(output).to.deep.equal(expectedOutput);
        });
    });
});

