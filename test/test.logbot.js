/*jshint expr: true*/
var Sinon = require('sinon');
var Nock = require('nock');
var expect = require('chai').expect;

var Logbot = require('../lib/source/logbot');

describe('Logbot', function() {
    afterEach(function () {
        Sinon.restore();
    });

    describe('getEntries', function() {
        it('generates entry based on formatted log', function() {
            Nock('https://logbotcmd.herokuapp.com')
                .post('/logs', {'token': 'abcd'})
                .query(true)
                .reply(200, {
                    result: [
                        {
                            'message': '_internal 1 Meeting',
                            'log_date': '2017-06-29'
                        }
                    ]
                });
            var authStub = {
                'getAuth': Sinon.stub().resolves('abcd')
            };

            var options = {
                'startDate': '2017-06-28',
                'endDate': '2017-06-30',
                'logbot': true
            };
            var logbot = new Logbot(options, authStub);
            return logbot.getEntries()
                .then(function(result) {
                    expect(result).to.deep.equal([{
                        project: '_internal',
                        time: '1',
                        text: 'Meeting',
                        timestamp: '1498687200',
                        type: 'logbot',
                    }]);
                });
        });
    });
});

