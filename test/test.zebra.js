/*jshint expr: true*/
var Sinon = require('sinon');
var Nock = require('nock');
var expect = require('chai').expect;

var sandbox = Sinon.sandbox.create();

var zebra = require('../lib/zebra');

describe('Zebra', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('getTimesheets', function() {
        it('generates entries based on timesheets', function(done) {
            Nock('https://zebra.liip.ch')
                .get('/api/v2/timesheets')
                .query(true)
                .reply(200, {
                    data: {
                        list: [{
                            occupation_alias: '_test',
                            time: '12',
                            description: 'Test Zebra Entry',
                            date: '2017-04-23',
                            project_name: 'Zebra Test'
                        }]
                    }
                });


            var options = {
                'startDate': '2017-03-28',
                'endDate': '2017-03-30',
                'zebra': true
            };
            zebra.getTimesheets(function(err, result) {
                expect(err).to.not.exist;
                expect(result).to.deep.equal([{
                    project: '_test',
                    time: '12',
                    text: 'Test Zebra Entry',
                    timestamp: '1492898400',
                    type: 'zebra',
                    comment: true,
                    graph: {
                        label: 'Zebra Test - 12',
                        value: 12.0
                    }
                }]);
                done();
            }, '1234', options);
        });
    });
});

