var JiraApi = require('jira-client');
var Moment = require('moment-timezone');
var jira_auth = require('./jira_auth');

exports.getActivities = getActivities;

function getActivities(callback, auth, count, startDate, endDate) {
    var config = {
        protocol: 'https',
        host: 'jira.liip.ch',
        apiVersion: '2',
        strictSSL: true,
        oauth: {
            consumer_key: auth.consumer_key,
            consumer_secret: auth.consumer_secret,
            access_token: auth.access_token,
            access_token_secret: auth.access_token_secret
        }
    };
    var jira = new JiraApi(config);

    var issueNumber = 'OGDZH-289';
    jira.findIssue(issueNumber)
      .then(function(issue) {
        console.log(issue);
        var msg = {
            'project': 'xxx',
            'time': '',
            'text': issue.fields.summary,
            'timestamp': Moment(issue.fields.lastViewed).format('X'),
            'type': 'jira',
            'comment': false
        };
        callback(null, [msg]);
      })
      .catch(function(err) {
        console.error(err);
      });
}
