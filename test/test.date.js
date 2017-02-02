/*jshint expr: true*/
var expect = require('chai').expect;

var date = require('../lib/date');

describe('Date string with single date', function() {
    it('should return return object with the given date based on CET timezone', function() {
        expect(date.getStartAndEndDate('01.02.2016')).to.be.deep.equal({
            "startDate": "2016-01-31T23:00:00.000Z",
            "endDate": "2016-02-01T22:59:59.999Z",
        });
    });
});

describe('Date string with start and end date', function() {
    it('should return return object with the given dates based on CET timezone', function() {
        expect(date.getStartAndEndDate('01.02.2016-02.02.2016')).to.be.deep.equal({
            "startDate": "2016-01-31T23:00:00.000Z",
            "endDate": "2016-02-01T23:00:00.000Z"
        });
    });
});
