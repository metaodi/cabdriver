/*jshint expr: true*/
var Sinon = require('sinon');
var stdMocks = require('std-mocks');
var MockFs = require('mock-fs');
var expect = require('chai').expect;

var google_auth = require('../lib/google_auth');
var calendar = require('../lib/calendar');
var mail = require('../lib/mail');

var cli = require('../lib/cli');

var sandbox = Sinon.sandbox.create();

describe('CLI', function() {
    afterEach(function () {
        sandbox.restore();
        stdMocks.restore();
        MockFs.restore();
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
                var authStub = sandbox.stub(google_auth, 'getAuth').yields({"auth": 123});
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
                var authStub = sandbox.stub(google_auth, 'getAuth').yields({"auth": 123});
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
        describe('Failing source', function() {
            it('should not fail everything, print error msg on stderr', function(done) {
                //setup stubs
                stdMocks.use();
                var authStub = sandbox.stub(google_auth, 'getAuth').yields({"auth": 123});
                var mailStub = sandbox.stub(mail, 'listMessages').yields('Could not fetch mails');

                var options = {'mail': true};
                cli.querySources(options, function(err, results) {
                    expect(err).to.not.exist;
                    expect(results).to.deep.equal([]);

                    var output = stdMocks.flush().stderr;
                    stdMocks.restore();
                    expect(output).to.deep.equal([
                        "\n",
                        "mail source failed with error: Could not fetch mails\n"
                    ]);
                    done();
                });
            });
        });
    });
    describe('printResults', function() {
        it('should print a correct calendar taxi entry', function() {
            //setup mocks
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
    describe('getOptions', function() {
        it('should combine config values with cli arguments', function() {
            //setup mocks
            stdMocks.use();
            var config = {
                'defaults': {
                    'jira': false,
                    'slack': true,
                    'logbot': false,
                    'calendar': 'primary',
                    'zebra': false,
                    'git': false,
                    'mail': false,
                    'pie': false,
                    'hours': false,
                    'number': 1000
                }
            };
            var optsStub = sandbox.stub().returns(
                {
                    'date': '02.12.2017',
                    'jira': true,
                    'verbose': true,
                    'hours': true
                }
            );
            var programStub = {'opts': optsStub};


            cli.getOptions(programStub, config);
            var output = stdMocks.flush().stdout;
            stdMocks.restore();
            var expectedOutput = [
                "Start date: 02.12.2017\n",
                "End date: 02.12.2017\n",
                "Calendar: primary\n",
                "Mail: false\n",
                "Slack: true\n",
                "Logbot: false\n",
                "Jira: true\n",
                "Zebra: false\n",
                "Git: false\n",
                "Pie chart: false\n",
                "Hours: true\n",
                "Count: 1000\n",
            ];
            expect(output).to.deep.equal(expectedOutput);
        });
    });
    describe('loadConfig', function() {
        it('should load a provided config file', function() {
            //setup mocks
            var ymlContent = 'defaults:\n' +
                '   jira: true\n' +
                '   slack: true\n' +
                '   calendar: primary\n' +
                '   zebra: false\n' +
                '   logbot: true\n' +
                '   git: /home/testuser\n' +
                '   hours: true';
            MockFs({
              '/home/testuser/.cabdriver/cabdriver.yml': ymlContent 
            });
            

            var config = cli.loadConfig('/home/testuser/.cabdriver/');
            expect(config).to.deep.equal({
                'defaults': {
                    'jira': true,
                    'slack': true,
                    'calendar': 'primary',
                    'zebra': false,
                    'logbot': true,
                    'git': '/home/testuser',
                    'hours': true
                }
            });
        });
        it('should default to empty config on error', function() {
            //setup mocks
            stdMocks.use();
            MockFs({
              '/home/testuser/.cabdriver/cabdriver.yml': 'test: badconfig'
            });
            

            var config = cli.loadConfig('/home/testuser/.cabdriver/');
            expect(config).to.deep.equal({'defaults': {}});

            var output = stdMocks.flush().stderr;
            expect(output).to.deep.equal(["Config file has no 'defaults' key\n"]);
        });
    });
});

