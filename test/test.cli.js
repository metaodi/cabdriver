/*jshint expr: true*/
var Sinon = require('sinon');
var expect = require('chai').expect;
var CliTest = require('command-line-test');

var path = require('path');
var pkg = require('../package.json');

var cab = path.resolve(__dirname, '..', pkg.bin['cab']);
var cabdriver = path.resolve(__dirname, '..', pkg.bin['cabdriver']);
var cabdriverFetch = path.resolve(__dirname, '..', pkg.bin['cabdriver-fetch']);
var cabdriverSheet = path.resolve(__dirname, '..', pkg.bin['cabdriver-sheet']);

var test_config = path.resolve(__dirname, 'test_cabdriver.yml');

describe('CLI', function() {
    //cli invokation might take some time, increase timeout to 5s
    this.timeout(5000);

    afterEach(function () {
        Sinon.restore();
    });

    describe('CLI commands', function() {
        it('`cabdriver --version` should return version', function() {
            var cliTest = new CliTest();
            return cliTest.execFile(cabdriver, ['--version'], {})
                .then(function(res) {
                    expect(res.stdout).to.contain(pkg.version);
                });
        });
        it('`cabdriver` without command should run `fetch` command', function() {
            var cliTest = new CliTest();
            return cliTest.execFile(cabdriver, ['--test'], {})
                .then(function(res) {
                    var options = JSON.parse(res.stdout);
                    expect(options.cmdName).equal('fetch');
                });
        });
        it('`cab` without command should run `fetch` command', function() {
            var cliTest = new CliTest();
            return cliTest.execFile(cab, ['--test'], {})
                .then(function(res) {
                    var options = JSON.parse(res.stdout);
                    expect(options.cmdName).equal('fetch');
                });
        });
        it('`cabdriver fetch` should run `fetch` command', function() {
            var cliTest = new CliTest();
            return cliTest.execFile(cabdriver, ['fetch', '--test'], {})
                .then(function(res) {
                    var options = JSON.parse(res.stdout);
                    expect(options.cmdName).equal('fetch');
                });
        });
        it('`cabdriver sheet` should run `sheet` command', function() {
            var cliTest = new CliTest();
            return cliTest.execFile(cabdriver, ['sheet', '--test'], {})
                .then(function(res) {
                    var options = JSON.parse(res.stdout);
                    expect(options.cmdName).equal('sheet');
                });
        });
        it('`cabdriver-fetch` should run `fetch` command', function() {
            var cliTest = new CliTest();
            return cliTest.execFile(cabdriverFetch, ['--test'], {})
                .then(function(res) {
                    var options = JSON.parse(res.stdout);
                    expect(options.cmdName).equal('fetch');
                });
        });
        it('`cabdriver-sheet` should run `sheet` command', function() {
            var cliTest = new CliTest();
            return cliTest.execFile(cabdriverSheet, ['--test'], {})
                .then(function(res) {
                    var options = JSON.parse(res.stdout);
                    expect(options.cmdName).equal('sheet');
                });
        });
    });
    describe('CLI arguments', function() {
        it('`cabdriver --github` should query only github', function() {
            var cliTest = new CliTest();
            return cliTest.execFile(cabdriver, ['--github', '--test'], {})
                .then(function(res) {
                    var options = JSON.parse(res.stdout);
                    expect(options.github).to.be.true;
                });
        });
    });
    describe('CLI with config file', function() {
        it('`cabdriver` should query all defaults from the config', function() {
            var cliTest = new CliTest();
            return cliTest.execFile(cabdriver, ['--config', test_config, '--test'], {})
                .then(function(res) {
                    var options = JSON.parse(res.stdout);
                    expect(options.jira).to.be.true;
                    expect(options.slack).to.be.true;
                    expect(options.calendar).to.be.equal('primary');
                    expect(options.zebra).to.be.false;
                    expect(options.logbot).to.be.true;
                    expect(options.hours).to.be.true;
                    expect(options.git).to.be.equal('/home/testuser');
                });
        });
    });
});

