var JiraApi = require('jira-client');
var Moment = require('moment-timezone');
var Async = require('async');
var _ = require('underscore');

exports.getActivities = getActivities;

function getActivities(callback, auth, count, startDate, endDate, verbose) {
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
    var startDateObj = Moment(startDate).tz('Europe/Zurich');
    var endDateObj = Moment(endDate).tz('Europe/Zurich');

    var currentUser = null;
    jira.getCurrentUser()
        .then(function(user) {
            currentUser = user.key;
            // this query is an attempt to find issues that the current user potentially worked on, unfortunately there is currently no better way to do it since the defined startdate
            // after getting this list, each issue's changelog is checked for action of the current user
            var query = "(assignee = currentUser() OR reporter = currentUser() OR creator = currentUser() OR watcher = currentUser() OR key in issueHistory()) AND updatedDate >= " + startDateObj.format("YYYY-MM-DD");
            return jira.searchJira(query);
        })
        .then(function(result) {
            Async.map(
                result.issues,
                function(issue, issueCb) {
                    jira.findIssue(issue.key, 'changelog')
                        .then(generateDailyEntries(currentUser, startDateObj, endDateObj, verbose, issueCb))
                        .catch(issueCb);
                },
                function(err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null, _.flatten(results));
                    }
                }
            );
        })
        .catch(function(err) {
            callback("The JIRA API returned an error: " + err);
        });
}

function generateDailyEntries(currentUser, startDate, endDate, verbose, callback) {
    return function(issue) {
        var project = issue.key.split('-')[0].toLowerCase();


        // filter changelog entries by the current user and in the defined time span
        process.stdout.write("Issue " + issue.key + " changelog: [");
        var myChangelogEntries = _.filter(issue.changelog.histories, function(entry) {
            var created = Moment(entry.created).startOf('day');
            var match = entry.author.key === currentUser && created.isBetween(startDate, endDate, null, '[]');
            if (verbose) {
                process.stdout.write((match ? 'x' : '.'));
            }
            return match;
        });
        process.stdout.write("]\n");
        var changelogMsgs = _.map(myChangelogEntries, function(entry) {
            var msg = {
                'project': project,
                'time': '1',
                'text': issue.key + ': ' + issue.fields.summary,
                'timestamp': Moment(entry.created).startOf('day').format('X'),
                'type': 'jira',
                'comment': false
            };
            return msg;
        });
        changelogMsgs = _.uniq(changelogMsgs, function(msg) { 
            return msg.timestamp;
        });

        //filter worklog entries
        process.stdout.write("Issue " + issue.key + " worklog: [");
        var myWorklog = _.filter(issue.fields.worklog.worklogs, function(log) {
            var started = Moment(log.started).startOf('day');
            var match = log.author.key === currentUser && started.isBetween(startDate, endDate, null, '[]');
            if (verbose) {
                process.stdout.write((match ? 'x' : '.'));
            }
            return match;
        });
        process.stdout.write("]\n");
        var worklogMsgs = _.map(myWorklog, function(log) {
            var hours = log.timeSpentSeconds / 3600;
            var text = log.comment || issue.fields.summary;
            var msg = {
                'project': project,
                'time': (Math.round(hours * 100) / 100).toString(),
                'text': issue.key + ' worklog: ' + text,
                'timestamp': Moment(log.started).startOf('day').format('X'),
                'type': 'jira',
                'comment': false
            };
            return msg;
        });
        
        // use worklog entries if they exist, otherwise use changelog
        if (!_.isEmpty(worklogMsgs)) {
            callback(null, worklogMsgs);
        } else {
            callback(null, changelogMsgs);
        }

    };
}
