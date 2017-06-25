var GithubApi = require('github-api');
var Moment = require('moment-timezone');
var Promise = require('bluebird');
var Async = require('async');
var _ = require('lodash');

var helper = require('./helper');


function Github() {}

Github.prototype.getContributions = function(callback, auth, options) {
    var me = this;
    var gh = new GithubApi({token: auth});

    Promise.join(
        me.getGitHubUsername(gh),
        me.getIssuesAndPullRequests(gh, options),
        function(username, issues) {
            helper.printVerbose('Getting GitHub issues/pull requests: [', options.verbose);
            Async.mapSeries(
                issues,
                function(issue, issueCb) {

                    var matches = issue.repository_url.match(/.*\/(.*)\/(.*)$/);
                    var owner = matches[1];
                    var repo = matches[2];
                    var issueId = issue.number;

                    helper.printVerbose('.', options.verbose);

                    Async.parallel([
                        function(creationCb) {
                            var created = Moment(issue.created_at).tz('Europe/Zurich');
                            var start = Moment(options.startDate).tz('Europe/Zurich');
                            var end = Moment(options.endDate).tz('Europe/Zurich').add(1, 'd');

                            var msg = null;
                            if (created.isBetween(start, end, null, '[]') && issue.user.login === username) {
                                msg = {
                                    'project': repo,
                                    'time': '1',
                                    'text': '#' + issue.number + ': ' + issue.title,
                                    'timestamp': created.startOf('day').format('X'),
                                    'type': 'github',
                                    'comment': false
                                };
                                if (options.verbose) {
                                    msg.text += ' (issue created)';
                                }
                            }
                            creationCb(null, msg);
                            
                        },
                        function(eventCb) {
                            me.getIssueEvents(gh, owner, repo, issueId, username, options)
                            .then(function(events) {
                                events = _.map(events, function(issueEvent) {
                                    helper.printVerbose('x', options.verbose);
                                    var timestamp = Moment(issueEvent.created_at).tz('Europe/Zurich').startOf('day').format('X');
                                    var msg = {
                                        'project': repo,
                                        'time': '1',
                                        'text': '#' + issue.number + ': ' + issue.title,
                                        'timestamp': timestamp,
                                        'type': 'github',
                                        'comment': false
                                    };
                                    if (options.verbose) {
                                        msg.text += ' (' + me.eventDescription(issueEvent.event) + ')';
                                    }
                                    return msg;
                                });

                                eventCb(null, events);
                            });
                        },
                        function(commentCb) {
                            me.getIssueComments(gh, owner, repo, issueId, username, options)
                            .then(function(comments) {
                                comments = _.map(comments, function(comment) {
                                    helper.printVerbose('x', options.verbose);
                                    var timestamp = Moment(comment.created_at).tz('Europe/Zurich').startOf('day').format('X');
                                    var msg = {
                                        'project': repo,
                                        'time': '1',
                                        'text': '#' + issue.number + ': ' + issue.title,
                                        'timestamp': timestamp,
                                        'type': 'github',
                                        'comment': false
                                    };
                                    if (options.verbose) {
                                        msg.text += ' (comment on issue)';
                                    }
                                    return msg;
                                });
                                commentCb(null, comments);
                            });
                        }
                    ],
                    function(err, results) {
                        var flatResults = _.flatten(results);
                        var uniqueResults = _.uniqWith(flatResults, _.isEqual);
                        issueCb(null, uniqueResults);
                    });
                },
                function(err, results) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    helper.printVerbose("]\n", options.verbose);
                    results = _.flatten(results);
                    results = _.filter(results, function(item) {
                        return !_.isEmpty(item);
                    });
                    callback(null, results);
                }
            );
        });
};

Github.prototype.eventDescription = function(eventName) {
    var eventDescriptions = {
		'closed': 'closed issue',
		'reopened': 'reopenend issue',
		'subscribed': 'subscribed to notifications',
		'merged': 'PR was merged',
		'referenced': 'issue was referenced in commit',
        'mentioned': 'user was mentioned in issue',
		'assigned': 'user was assigned',
		'unassigned': 'user was unassigned',
		'labeled': 'label added to issue',
		'unlabeled': 'label was removed from the issue',
		'milestoned': 'issue was added to a milestone',
		'demilestoned': 'issue was removed from a milestone',
		'renamed': 'issue title was changed',
		'locked': 'issue was locked',
		'unlocked': 'issue was unlocked',
		'head_ref_deleted': 'branch deleted from PR',
		'head_ref_restored': 'brnahc restored from PR',
		'review_dismissed': 'review of PR dismissed by user',
		'review_requested': 'review requested',
		'review_request_removed': 'review request removed',
		'added_to_project': 'issue was added to a project board',
		'moved_columns_in_project': 'issue was moved on project board',
		'removed_from_project': 'issue was removed from a project board',
		'converted_note_to_issue': 'issue converted from note',
    };
    if (eventName in eventDescriptions) {
        return eventDescriptions[eventName];
    }
    return "Unknown event '" + eventName + "'";
};

Github.prototype.getIssuesAndPullRequests = function(gh, options) {
    var me = this;
    var search = gh.search();
    var start = Moment(options.startDate).tz('Europe/Zurich');
    var end = Moment(options.endDate).tz('Europe/Zurich').add(1, 'd');
    
    return me.getGitHubUsername(gh)
        .then(function(username) {
            var query = 'involves:' + username + ' updated:>=' + start.format('YYYY-MM-DD') + ' created:<=' + end.format('YYYY-MM-DD');
            helper.logVerbose('GitHub search query: ' + query, options.verbose);
            return search.forIssues({q: query});
        })
        .then(function(result) {
            return result.data;
        });
};

Github.prototype.getGitHubUsername = function(gh) {
    var user = gh.getUser();
    return user.getProfile()
        .then(function(result) {
            var githubUsername = result.data.login;
            return githubUsername;
        });
};

Github.prototype.getIssueEvents = function(gh, owner, repo, issue, user, options) {
    var issues = gh.getIssues(owner, repo);
    var start = Moment(options.startDate).tz('Europe/Zurich');
    var end = Moment(options.endDate).tz('Europe/Zurich').add(1, 'd');
    return issues.listIssueEvents(issue)
        .then(function(result) {
            var userEvents = _.filter(
                result.data,
                function(issueEvent) {
                    var isUser = (issueEvent.actor.login === user || (issueEvent.subject && issueEvent.subject.login === user));

                    var created = Moment(issueEvent.created_at).tz('Europe/Zurich');
                    var inTimeRange = created.isBetween(start, end, null, '[]');

                    return (isUser && inTimeRange);
                }
            );
            return userEvents;
        });
};

Github.prototype.getIssueComments = function(gh, owner, repo, issue, user, options) {
    var issues = gh.getIssues(owner, repo);
    var start = Moment(options.startDate).tz('Europe/Zurich');
    var end = Moment(options.endDate).tz('Europe/Zurich').add(1, 'd');
    return issues.listIssueComments(issue)
        .then(function(result) {
            var userComments = _.filter(
                result.data,
                function(comment) {
                    var isUser = (comment.user.login === user);

                    var created = Moment(comment.created_at).tz('Europe/Zurich');
                    var inTimeRange = created.isBetween(start, end, null, '[]');

                    return (isUser && inTimeRange);
                }
            );
            return userComments;
        });
};

module.exports = new Github();
