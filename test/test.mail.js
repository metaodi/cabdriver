/*jshint expr: true*/
var Sinon = require('sinon');
var expect = require('chai').expect;

var mail = require('../lib/mail');
var Google = require('googleapis');

var sandbox = Sinon.sandbox.create();

describe('Mail', function() {
    afterEach(function () {
        sandbox.restore();
    });

    describe('listMessages', function() {
        it('returns the correct msgs', function() {
            var callback = sandbox.spy();
            var listStub = sandbox.stub().yields(
                null,
                {
                    'messages': {'id': 12345}
                }
            );
            var getStub = sandbox.stub().yields(
                null,
                {
                    'internalDate': '1497088800000',
                    'payload': {
                        'headers': [
                            {'name': 'Subject', 'value': 'Test Email'},
                            {'name': 'From', 'value': 'test@example.com'},
                        ]
                    }
                }
            );
            var googleStub = sandbox.stub(Google, 'gmail').returns({
                'users': 
                    {
                        'messages': {
                            'list': listStub,
                            'get': getStub,
                        }
                    }
            });
            
            var options = {
                'count': 11,
                'startDate': '2017-04-09',
                'endDate': '2017-04-11',
                'mail': true
            };
            mail.listMessages(callback, '1234', options);
            var msg = {
                'project': 'xxx',
                'time': '12:00',
                'text': 'Test Email (From: test@example.com)',
                'timestamp': "1497045600",
                'comment': false,
                'type': 'mail'
            };
            Sinon.assert.calledWith(callback, null, [msg]);
        });
    });
});

