/*jshint expr: true*/
var expect = require('chai').expect;
var tk = require('timekeeper');
var Moment = require('moment-timezone');

var date = require('../lib/date');

describe('Date', function() {
    describe('getStartAndEndDate', function() {
        describe('Date string with single date', function() {
            it('should return object with the given date based on CET timezone', function() {
                expect(date.getStartAndEndDate('01.02.2016')).to.be.deep.equal({
                    "startDate": "2016-01-31T23:00:00.000Z",
                    "endDate": "2016-02-01T22:59:59.999Z",
                });
            });
        });

        describe('Date string with start and end date', function() {
            it('should return object with the given dates based on CET timezone', function() {
                expect(date.getStartAndEndDate('01.02.2016-02.02.2016')).to.be.deep.equal({
                    "startDate": "2016-01-31T23:00:00.000Z",
                    "endDate": "2016-02-01T23:00:00.000Z"
                });
            });
        });

        describe('Date string with semantic date', function() {
            before(function() {
                // Mon 09 Apr 2018 01:32:31 UTC+0200 (CEST)
                // Sun 08 Apr 2018 23:32:31 UTC+0000 (UTC)
                var time = new Date(1523230351000); 
                tk.freeze(time);
            });
            after(function() {
                tk.reset();
            });
            it('should return object with start and end date based on CET timezone', function() {
                expect(date.getStartAndEndDate('today')).to.be.deep.equal({
                    "startDate": "2018-04-09T21:59:59.999Z",
                    "endDate": "2018-04-09T21:59:59.999Z"
                });
                var today = Moment().tz('Europe/Zurich');
                expect(date.getStartAndEndDate('today')).to.be.deep.equal({
                    "startDate": today.endOf('day').toISOString(),
                    "endDate": today.endOf('day').toISOString()
                });
            });
        });
    });
    describe('parseTimeRange', function() {
        describe('Valid timerange', function() {
            it('should return the correct hour diff', function() {
                expect(date.parseTimeRange('13:45-15:00')).to.be.equal(1.25);
            });
        });

        describe('Invalid time range', function() {
            it('should return NaN (string)', function() {
                expect(date.parseTimeRange('asdf')).to.be.NaN;
            });
            it('should return NaN (invalid time)', function() {
                expect(date.parseTimeRange('28:00-31:00')).to.be.NaN;
            });
        });
    });
    describe('parseFirstDayOfMonth', function() {
        describe('Valid month strings', function() {
            it('should return the correct first day of the given text month', function() {
                expect(date.parseFirstDayOfMonth('feb', '2012')).to.be.equal('2012-01-31T23:00:00.000Z');
            });
            it('should return the correct first day of the given number month', function() {
                expect(date.parseFirstDayOfMonth('10', '2017')).to.be.equal('2017-09-30T22:00:00.000Z');
            });
            it('should return the correct first day of the semantic month', function() {
                var nextMonth = Moment().tz('Europe/Zurich').add(1, 'months').startOf('month').toISOString();
                expect(date.parseFirstDayOfMonth('next-month')).to.be.equal(nextMonth);
            });
        });
        describe('Invalid month strings', function() {
            it('should return current month for random string', function() {
                var currentMonth = Moment().tz('Europe/Zurich').startOf('month').toISOString();
                expect(date.parseFirstDayOfMonth('asdf')).to.be.equal(currentMonth);
            });
            it('should return current month for incomplete date', function() {
                var currentMonth = Moment().tz('Europe/Zurich').startOf('month').toISOString();
                expect(date.parseFirstDayOfMonth('08-2018')).to.be.equal(currentMonth);
            });
        });
    });
});
