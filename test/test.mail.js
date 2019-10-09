/*global describe it afterEach*/
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
                        'time': '1',
                        'text': 'Test Email (test@example.com, 12:00)',
                        'timestamp': '1497045600',
                        'comment': false,
                        'type': 'mail'
                    };
                    expect(results).to.be.deep.equal([msg]);
                });
        });
        it('generates the correct args based on the config', function() {
            var listStub = Sinon.stub().resolves({'data': {'messages': []}});
            var googleStub = Sinon.stub(google, 'gmail').returns({
                'users': 
                    {
                        'messages': {
                            'list': listStub
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

            var testConfig = {'mail': {
                'include': ['include1', 'include2'],
                'exclude': ['exclude1', 'exclude2', 'exclude3'],
                'query': 'is:unread'
            }
            };

            return mail.getEntries(testConfig)
                .then(function(results) {
                    expect(listStub.args[0][0]).to.be.deep.equal({
                        'maxResults': 11,
                        'q': 'is:unread (label:include1 OR label:include2) -label:exclude1 -label:exclude2 -label:exclude3 after:1491688799 before:1491948000',
                        'userId': 'me'
                    });
                });
        });
        it('returns the correct msg based on the cache', function() {
            var cache = Cache({'persist': false});
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
                        'time': '1',
                        'text': 'Test Email (test@example.com, 16:08)',
                        'timestamp': '1465200',
                        'comment': false,
                        'type': 'mail'
                    };
                    expect(results).to.be.deep.equal([msg]);
                });
        });
        it('returns the correct msgs with pagination', function() {
            //setup stubs
            var listStub = Sinon.stub();
            listStub.onCall(0).resolves(
                {
                    'data': {
                        'nextPageToken': 'aaabbbcccddd',
                        'messages': [{'id': 12348}]
                    }
                }
            );
            listStub.onCall(1).resolves(
                {
                    'data': {
                        'nextPageToken': 'aaabbbcccdddeee',
                        'messages': [{'id': 98767}]
                    }
                }
            );
            listStub.onCall(2).resolves({'data': {}});

            var getStub = Sinon.stub();
            getStub.onCall(0).resolves(
                {
                    'data': {
                        'internalDate': '1531205917000',
                        'payload': {
                            'headers': [
                                {'name': 'Subject', 'value': 'Test Email 1'},
                                {'name': 'From', 'value': 'test1@example.com'},
                            ]
                        }
                    }
                }
            );
            getStub.onCall(1).resolves(
                {
                    'data': {
                        'internalDate': '1531205917000',
                        'payload': {
                            'headers': [
                                {'name': 'Subject', 'value': 'Test Email 2'},
                                {'name': 'From', 'value': 'Jane Doe <test2@example.com>'},
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
                'startDate': '2018-07-10',
                'mail': 'true',
                'cache': cache
            };
            var authStub = {'getAuth': Sinon.stub().resolves('1234')};
            var mail = new GoogleMail(options, authStub);

            return mail.getEntries()
                .then(function(results) {
                    var msgs = [
                        {
                            'project': 'xxx',
                            'time': '1',
                            'text': 'Test Email 2 (Jane Doe, 08:58)',
                            'timestamp': '1531173600',
                            'comment': false,
                            'type': 'mail'
                        },
                        {
                            'project': 'xxx',
                            'time': '1',
                            'text': 'Test Email 1 (test1@example.com, 08:58)',
                            'timestamp': '1531173600',
                            'comment': false,
                            'type': 'mail'
                        }
                    ];
                    Sinon.assert.calledWith(listStub, {
                        'userId': 'me',
                        'maxResults': 11,
                        'q': ' after:1531173599',
                        'pageToken': 'aaabbbcccddd',
                    }); 
                    Sinon.assert.calledWith(listStub, {
                        'userId': 'me',
                        'maxResults': 11,
                        'q': ' after:1531173599',
                        'pageToken': 'aaabbbcccdddeee',
                    }); 
                    expect(results).to.be.deep.equal(msgs);
                });
        });
    });
});

