/*jshint expr: true*/
var Sinon = require('sinon');
var stdMocks = require('std-mocks');
var MockFs = require('mock-fs');
var expect = require('chai').expect;
var path = require('path');

var GoogleAuth = require('../lib/auth/google_auth');
var GoogleCalendar = require('../lib/calendar');
var GoogleMail = require('../lib/mail');

var FetchCli = require('../cli/fetch');

var sandbox = Sinon.sandbox.create();

describe('CLI Fetch', function() {
    afterEach(function () {
        sandbox.restore();
        stdMocks.flush();
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
                var cli = new FetchCli(options, null, sourceConfig);

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
                var cli = new FetchCli(options, null, {});
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
                var cli = new FetchCli(options, null, sourceConfig);
                cli.querySources(function(err, results) {
                    try {
                        expect(err).to.not.exist;
                        expect(results).to.deep.equal([]);

                        var output = stdMocks.flush().stderr;
                        stdMocks.restore();
                        expect(output).to.include(
                            "mail source failed: Could not fetch mails\n"
                        );
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
            });
        });
    });
    describe('postProcess', function() {
        it('should map entries to defined projects', function() {
            var test_config = path.resolve(__dirname, 'test_mapping.yml');
            var cli = new FetchCli(null, test_config);

            var msgs = [
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Team Meeting',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Meeting',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'important internal stuff',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'company',
                        'time': '2',
                        'text': 'Something important',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'git'
                }
            ];
            var result = cli.postProcess(msgs);

            expect(result[0].project).to.equal('_internal');
            expect(result[1].project).to.equal('xxx');
            expect(result[2].project).to.equal('_internal');
            expect(result[3].project).to.equal('_internal');
        });
        it('should map entries to first defined project', function() {
            var test_config = path.resolve(__dirname, 'test_mapping.yml');
            var cli = new FetchCli(null, test_config);

            var msgs = [
                {
                        'project': 'open-source',
                        'time': '1',
                        'text': 'Ticket 1',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'jira'
                }
            ];
            var result = cli.postProcess(msgs);

            expect(result[0].project).to.equal('acme_dev');
        });
        it('should not change any entries if no mapping is defined', function() {
            var test_config = path.resolve(__dirname, 'test_cabdriver.yml');
            var cli = new FetchCli(null, test_config);

            var msgs = [
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Team Meeting',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Meeting',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'important internal stuff',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'company',
                        'time': '2',
                        'text': 'Something important',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'git'
                }
            ];
            var result = cli.postProcess(msgs);

            expect(result).to.deep.equal(msgs);
        });
        it('should comment out entries mapped to `__comment__`', function() {
            var test_config = path.resolve(__dirname, 'test_mapping.yml');
            var cli = new FetchCli(null, test_config);

            var msgs = [
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Meeting',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Lunch',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                }
            ];
            var result = cli.postProcess(msgs);

            expect(result[0].comment).to.be.false;
            expect(result[1].comment).to.be.true;
        });
        it('should remove entries mapped to `__remove__`', function() {
            var test_config = path.resolve(__dirname, 'test_mapping.yml');
            var cli = new FetchCli(null, test_config);

            var msgs = [
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Meeting',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Hours!',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Important Meeting',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                }
            ];
            var result = cli.postProcess(msgs);

            expect(result.length).to.equal(2);
        });
        it('should comment out entries mapped to `__remove__` when using --verbose', function() {
            var test_config = path.resolve(__dirname, 'test_mapping.yml');
            stdMocks.use();
            var cli = new FetchCli({'verbose': true}, test_config);
            stdMocks.restore();

            var msgs = [
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Meeting',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Hours!',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                },
                {
                        'project': 'xxx',
                        'time': '1',
                        'text': 'Hours!',
                        'timestamp': 123,
                        'comment': false,
                        'type': 'calendar'
                }
            ];
            var result = cli.postProcess(msgs);

            expect(result.length).to.equal(3);
            expect(result[1].comment).to.be.true;
            expect(result[1].text).to.include('[REMOVED]');
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
            var cli = new FetchCli(null, null, null);
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
    describe('sourcesInOptions', function() {
        it('should find sources in options', function() {
            var sources = {'test': '', 'jira': ''};
            var cli = new FetchCli(null, null, sources);
            
            var optionsWithOneSource = {'test': true, 'hallo': 'velo'};
            expect(cli.sourcesInOptions(optionsWithOneSource)).to.be.true;

            var optionsWithMultipleSources = {'test': 'blubb', 'hallo': 'velo', 'jira': true};
            expect(cli.sourcesInOptions(optionsWithMultipleSources)).to.be.true;

            var optionsWithoutSource = {'hallo': 'velo', 'bla': 'blubb'};
            expect(cli.sourcesInOptions(optionsWithoutSource)).to.be.false;
        });
        it('should not find any sources if there are none', function() {
            var sources = {};
            var cli = new FetchCli(null, null, sources);
            
            var options = {'test': true, 'hallo': 'velo'};
            expect(cli.sourcesInOptions(options)).to.be.false;
        });
    });
    describe('updateOptions', function() {
        it('should combine config values with cli arguments', function() {
            //setup mocks
            var ymlContent = 'defaults:\n' +
                    '   jira: false\n' +
                    '   slack: true\n' +
                    '   logbot: false\n' +
                    "   calendar: 'primary'\n" +
                    '   zebra: false\n' +
                    '   git: false\n' +
                    '   gitlab: true\n' +
                    '   github: true\n' +
                    '   mail: false\n' +
                    '   pie: false\n' +
                    '   hours: false\n' +
                    '   number: 1000';
            MockFs({
              '/home/testuser/.cabdriver/cabdriver.yml': ymlContent 
            });
            var opts = {
                'date': '02.12.2017',
                'jira': true,
                'verbose': true,
                'hours': true
            };
            stdMocks.use();
            var cli = new FetchCli(opts, '/home/testuser/.cabdriver/cabdriver.yml');

            var output = stdMocks.flush().stdout;
            var err = stdMocks.flush().stderr;
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
                "Config: undefined\n",
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
            expect(output).to.include("Config file has no 'defaults' key\n");
        });
    });
});

