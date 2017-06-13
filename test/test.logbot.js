/*jshint expr: true*/
var Sinon = require('sinon');
var Nock = require('nock');
var expect = require('chai').expect;

var sandbox = Sinon.sandbox.create();

var logbot = require('../lib/logbot');

describe('Logbot', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('getLogs', function() {
        it('generates entry based on formatted log', function(done) {
            Nock('https://logbotcmd.herokuapp.com')
                .post('/logs')
                .query(true)
                .reply(200, {
                    result: [
                        {
                            'message': '_internal 1 Meeting',
                            'log_date': '2017-06-29'
                        }
                    ]
                });


            var options = {
                'startDate': '2017-06-28',
                'endDate': '2017-06-30',
                'logbot': true
            };
            logbot.getLogs(function(err, result) {
                try {
                    expect(err).to.not.exist;
                    expect(result).to.deep.equal([{
                        project: '_internal',
                        time: '1',
                        text: 'Meeting',
                        timestamp: '1498687200',
                        type: 'logbot',
                    }]);
                    done();
                } catch (e) {
                    done(e);
                }
            }, '1234', options);
        });
    });
});

