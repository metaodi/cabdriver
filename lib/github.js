"use strict";

var GithubApi = require('github');
var Moment = require('moment-timezone');
var Promise = require('bluebird');
var _ = require('lodash');

var helper = require('./helper');
var Source = require('./source');


class Github extends Source {
    constructor(options, auth, api) {
        super(options, auth);
        this.type = 'github';
        this.api = api || new GithubApi({Promise: Promise});
    }

    generateEntries(auth) {
        var me = this;
        var gh = me.getApi(auth);

        return me.getGitHubUsername(gh)
            .then(function(username) {
                helper.printVerbose('Gather GitHub events: [', me.options.verbose);
                return me.getUserEvents(gh, username);
            })
            .then(function(events) {
                var eventMsgs = _.map(events, function(userEvent) {
                    var text = me.eventDescription(userEvent);
                    var timestamp = Moment(userEvent.created_at).tz('Europe/Zurich').startOf('day').format('X');
                    var repoName = userEvent.repo.name.split('/')[1];
                    var msg = {
                        'project': repoName,
                        'time': '1',
                        'text': text,
                        'timestamp': timestamp,
                        'type': 'github',
                        'comment': false
                    };
                    return msg;
                });
                var uniqueResults = _.uniqWith(eventMsgs, _.isEqual);
                var msgs = _.filter(uniqueResults, function(item) {
                    return !_.isEmpty(item);
                });
                helper.printVerbose(']', me.options.verbose);
                return msgs;
            });
    }

    getApi(token) {
        var me = this;
        me.api.authenticate({
            type: "oauth",
            token: token
        });
        return me.api;
    }

    eventDescription(userEvent) {
        /*jshint maxcomplexity:false */
        var eventType = userEvent.type;
        var payload = userEvent.payload;

        var text = '';
        if (payload.issue) {
            var issueId = payload.number || payload.issue.number;
            text = '#' + issueId + ': ' + payload.issue.title + ', ';
        } else if (payload.pull_request) {
            text = '#' + payload.pull_request.number + ': ' + payload.pull_request.title + ', '; 
        }

        switch (eventType) {
            case 'CommitCommentEvent':
                text += 'commit comment ' + payload.action;
                break;
            case 'CreateEvent':
                text += 'created ' + payload.ref_type + ' ' + (payload.ref ? payload.ref : '');
                break;
            case 'DeleteEvent':
                text += 'deleted ' + payload.ref_type + ' ' + payload.ref;
                break;
            case 'DeploymentEvent':
                text += 'deployment';
                break;
            case 'DeploymentStatusEvent':
                text += 'deployment status';
                break;
            case 'ForkEvent':
                text += 'forked repo ' + payload.forkee.name;
                break;
            case 'GistEvent':
                text += 'gist ' + payload.gist.description + ' ' + payload.action;
                break;
            case 'GollumEvent':
                text += 'edited the wiki';
                break;
            case 'InstallationEvent':
                text += 'GitHub app installation ' + payload.action;
                break;
            case 'InstallationRepositoriesEvent':
                text += 'GitHub app repo installation ' + payload.action;
                break;
            case 'IssueCommentEvent':
                text += 'comment ' + payload.action;
                break;
            case 'IssuesEvent':
                text += 'issue ' + payload.action;
                break;
            case 'LabelEvent':
                text += payload.label.name + ' ' + payload.action;
                break;
            case 'MarketplacePurchaseEvent':
                text += 'marketplace plan ' + payload.action;
                break;
            case 'MemberEvent':
                text += payload.member.login + ' ' + payload.action;
                break;
            case 'MembershipEvent':
                text += payload.member.login + ' ' + payload.action + (payload.action === 'added' ? ' to ' : ' from ') + payload.scope + ' ' + payload.team.name;
                break;
            case 'MilestoneEvent':
                text += 'milestone ' + payload.action;
                break;
            case 'OrganizationEvent':
                var orgAction = payload.action.replace('member_', '');
                text += 'user ' + orgAction + (orgAction === 'removed' ? ' from ' :' to ') + 'organization';
                break;
            case 'OrgBlockEvent':
                text += payload.blocked_user.login + ' ' + payload.action;
                break;
            case 'PageBuildEvent':
                text += 'page build';
                break;
            case 'ProjectCardEvent':
                text += 'project card ' + payload.action;
                break;
            case 'ProjectColumnEvent':
                text += 'project column ' + payload.action;
                break;
            case 'ProjectEvent':
                text += 'project ' + payload.action;
                break;
            case 'PublicEvent':
                text += 'repository ' + payload.repository.full_name + ' open sourced (yay!)';
                break;
            case 'PullRequestEvent':
                var prAction = payload.action.replace('_', ' ');
                text += 'pull request ' + prAction;
                break;
            case 'PullRequestReviewEvent':
                text += 'review ' + payload.action;
                break;
            case 'PullRequestReviewCommentEvent':
                text += 'review comment ' + payload.action;
                break;
            case 'PushEvent':
                text += 'pushed code to ' + payload.ref.replace('refs/heads/', '');
                break;
            case 'ReleaseEvent':
                text += 'release ' + payload.action;
                break;
            case 'RepositoryEvent':
                text += 'repository ' + payload.repository.full_name + ' ' + payload.action;
                break;
            case 'StatusEvent':
                text += "git commit status '" + payload.state + "'";
                break;
            case 'TeamEvent':
                text += 'team ' + payload.team.name + ' ' + payload.action;
                break;
            case 'TeamAddEvent':
                text += 'repository ' + payload.repository.full_name + ' added to team ' + payload.team.name;
                break;
            case 'WatchEvent':
                text += 'repository ' + userEvent.repo.name + ' starred';
                break;
            default:
                text += "unkown event type '" + eventType + "'";
                break;
        }
        return text;
    }

    getGitHubUsername(gh) {
        var me = this;

        var cacheResult = me.options.cache.getSync('github-username');
        if (cacheResult) {
            helper.printVerbose('loaded github username from cache', me.options.verbose);
            return Promise.resolve(cacheResult);
        }
        return gh.users.get({})
            .then(function(result) {
                var githubUsername = result.data.login;
                me.options.cache.putSync('github-username', githubUsername);
                return githubUsername;
            });
    }

    getUserEvents(gh, username) {
        var me = this;
        var start = Moment(me.options.startDate).tz('Europe/Zurich');
        var end = Moment(me.options.endDate).tz('Europe/Zurich').add(1, 'd');

        var activityPromise = gh.activity.getEventsForUser({
            username: username
        });

        return me.getAllItems(gh, activityPromise)
            .then(function(result) {
                var userEvents = _.filter(
                    result,
                    function(userEvent) {
                        var isUser = (userEvent.actor.login === username);

                        var created = Moment(userEvent.created_at).tz('Europe/Zurich');
                        var inTimeRange = created.isBetween(start, end, null, '[]');

                        return (isUser && inTimeRange);
                    }
                );
                return userEvents;
            });
    }

    getAllItems(gh, promise) {
        var me = this;
        var allItems = [];


        var cacheResult = me.options.cache.getSync('github-events');
        if (cacheResult) {
            helper.printVerbose('loaded from cache', me.options.verbose);
            return Promise.resolve({cacheResult});
        }

        function pager(res) {
            helper.printVerbose('.', me.options.verbose);
            allItems = allItems.concat(res.data);
            if (gh.hasNextPage(res)) {
                return gh.getNextPage(res)
                    .then(pager);
            }
            me.options.cache.putSync('github-events', allItems);
            return allItems;
        }
        return promise.then(pager);
    }
}

module.exports = Github;
