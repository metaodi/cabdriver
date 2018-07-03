/*jshint expr: true*/
var Sinon = require('sinon');
var expect = require('chai').expect;

var GoogleMail = require('../lib/source/mail');
const {google} = require('googleapis');
var Cache = require('persistent-cache');

describe('Mail', function() {
    afterEach(function () {
        Sinon.restore();
    });

    describe('generateEntries', function() {
        it('returns the correct msgs', function() {
            var callback = Sinon.spy();
            var listStub = Sinon.stub().resolves(
                {
                    'data': {
                        'messages': [{'id': 12345}]
                    }
                }
            );
            var getStub = Sinon.stub().resolves(
                {
                    'data': {
                        'internalDate': '1497088800000',
                        'payload': {
                            'headers': [
                                {'name': 'Subject', 'value': 'Test Email'},
                                {'name': 'From', 'value': 'test@example.com'},
                            ]
                        }
                    }
                }
            );
            var googleStub = Sinon.stub(google, 'gmail').returns({
                'users': 
                    {
                        'messages': {
                            'list': listStub,
                            'get': getStub,
                        }
                    }
            });
            var cache = Cache({'persist': false});
            
            var options = {
                'count': 11,
                'startDate': '2017-04-09',
                'endDate': '2017-04-11',
                'mail': true,
                'cache': cache
            };
            var authStub = {'getAuth': Sinon.stub().resolves('1234')};

            var mail = new GoogleMail(options, authStub);

            return mail.getEntries()
                .then(function(results) {
                    var msg = {
                        'project': 'xxx',
                        'time': '12:00',
                        'text': 'Test Email (From: test@example.com)',
                        'timestamp': "1497045600",
                        'comment': false,
                        'type': 'mail'
                    };
                    expect(results).to.be.deep.equal([msg]);
                });
        });
        it('returns the correct msg based on the cache', function() {
            var cache = Cache({'persist': false});
            var callback = Sinon.spy();
            var listStub = Sinon.stub().resolves(
                {
                    'data': {
                        'messages': [{'id': 12348}]
                    }
                }
            );
            var mailData = {
                'internalDate': '1523318400',
                'payload': {
                    'headers': [
                        {'name': 'Subject', 'value': 'Test Email'},
                        {'name': 'From', 'value': 'test@example.com'},
                    ]
                }
            };
            cache.putSync('gmail-msg-12348', mailData);

            var googleStub = Sinon.stub(google, 'gmail').returns({
                'users': 
                    {
                        'messages': {
                            'list': listStub
                        }
                    }
            });
            
            var options = {
                'count': 11,
                'startDate': '2018-04-09',
                'endDate': '2018-04-11',
                'mail': true,
                'cache': cache
            };
            var authStub = {'getAuth': Sinon.stub().resolves('1234')};

            var mail = new GoogleMail(options, authStub);

            return mail.getEntries()
                .then(function(results) {
                    var msg = {
                        'project': 'xxx',
                        'time': '16:08',
                        'text': 'Test Email (From: test@example.com)',
                        'timestamp': "1465200",
                        'comment': false,
                        'type': 'mail'
                    };
                    expect(results).to.be.deep.equal([msg]);
                });
        });
    });
});

