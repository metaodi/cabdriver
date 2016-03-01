/*jshint expr: true*/
var expect = require('chai').expect;

var cabdriver = require('../cabdriver');

describe('Date string with single date', function() {
    it('should return return object with the given date', function() {
        expect(cabdriver.getStartAndEndDate('01.02.2016')).to.be.deep.equal({
            "startDate": "2016-01-31T23:00:00.000Z",
            "endDate": ""
        });
    });
});

describe('Date string with start and end date', function() {
    it('should return return object with the given dates', function() {
        expect(cabdriver.getStartAndEndDate('01.02.2016-02.02.2016')).to.be.deep.equal({
            "startDate": "2016-01-31T23:00:00.000Z",
            "endDate": "2016-02-02T22:59:59.999Z"
        });
    });
});
