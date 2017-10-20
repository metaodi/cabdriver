/*jshint expr: true*/
var Sinon = require('sinon');
var stdMocks = require('std-mocks');
var MockFs = require('mock-fs');
var expect = require('chai').expect;

var GoogleAuth = require('../lib/google_auth');
var GoogleCalendar = require('../lib/calendar');
var GoogleMail = require('../lib/mail');

var FetchCli = require('../cli/fetch');

var sandbox = Sinon.sandbox.create();

describe('CLI Fetch', function() {
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
                var sourceStub = function() {
                    return {
                        'getEntries': sandbox.stub().resolves([expectedMsg])
                    };
                };
                var sourceConfig = {
                    calendar: { source: sourceStub, auth: GoogleAuth },
                };

                var options = {
                    'date': 'today',
                    'calendar': 'primary',
                };
                var cli = new FetchCli(options, sourceConfig);

                cli.querySources(function(err, results) {
                    expect(err).to.not.exist;
                    expect(results).to.be.deep.equal([expectedMsg]);
                    done();
                });
            });
            it('should return an empty list if argument is not set', function(done) {
                //setup stubs
                var options = {
                    'date': 'today'
                };
                var cli = new FetchCli(options, {});
                cli.querySources(function(err, results) {
                    try {
                        expect(err).to.not.exist;
                        expect(results).to.be.deep.equal([]);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
        });
        describe('Failing source', function() {
            it('should not fail everything, print error msg on stderr', function(done) {
                //setup stubs
                stdMocks.use();
                var sourceStub = function() {
                    return {
                        'getEntries': sandbox.stub().rejects('Could not fetch mails')
                    };
                };

                var options = {
                    'date': 'today',
                    'mail': true
                };
                var sourceConfig = {
                    mail: { source: sourceStub, auth: GoogleAuth },
                };
                var cli = new FetchCli(options, sourceConfig);
                cli.querySources(function(err, results) {
                    try {
                        expect(err).to.not.exist;
                        expect(results).to.deep.equal([]);

                        var output = stdMocks.flush().stderr;
                        stdMocks.restore();
                        expect(output).to.deep.equal([
                            "\n",
                            "mail source failed: Could not fetch mails\n"
                        ]);
                        done();
                    } catch (err) {
                        done(err);
                    }
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
            var cli = new FetchCli(null, null);
            cli.printResults([msg]);
            var output = stdMocks.flush().stdout;
            stdMocks.restore();
            var expectedOutput = [
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
            stdMocks.use();
            //setup mocks
            var config = {
                'defaults': {
                    'jira': false,
                    'slack': true,
                    'logbot': false,
                    'calendar': 'primary',
                    'zebra': false,
                    'git': false,
                    'gitlab': true,
                    'github': true,
                    'mail': false,
                    'pie': false,
                    'hours': false,
                    'number': 1000
                }
            };
            var opts = {
                'date': '02.12.2017',
                'jira': true,
                'verbose': true,
                'hours': true
            };
            var cli = new FetchCli(opts);
            cli.config = config;
            stdMocks.flush().stdout;

            cli.getOptions();
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
                "Github: true\n",
                "Gitlab: true\n",
                "Pie chart: false\n",
                "Hours: true\n",
                "Count: 1000\n",
            ];
            expect(output).to.deep.equal(expectedOutput);
        });
    });
    describe('loadConfig', function() {
        it('should load a provided config file', function() {
            var cli = new FetchCli();
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

            console.log("test");
            
            var config = cli.loadConfig('/home/testuser/.cabdriver/cabdriver.yml');
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
            MockFs({
              '/home/testuser/.cabdriver/cabdriver.yml': 'test: badconfig'
            });
            
            var cli = new FetchCli();
            stdMocks.use();
            var config = cli.loadConfig('/home/testuser/.cabdriver/cabdriver.yml');
            expect(config).to.deep.equal({'defaults': {}});

            var output = stdMocks.flush().stderr;
            stdMocks.restore();
            expect(output).to.deep.equal(["Config file has no 'defaults' key\n"]);
        });
    });
});

