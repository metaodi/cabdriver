var Moment = require('moment-timezone');
var Request = require('superagent');
var Async = require('async');
var Promise = require('bluebird');
var _ = require('lodash');

var helper = require('./helper');

function Gitlab() {}

Gitlab.prototype.getEvents = function(callback, auth, options) {
    var me = this;
    var startDateObj = Moment(options.startDate).tz('Europe/Zurich').subtract(1, 'days');
    var endDateObj = Moment(options.endDate).tz('Europe/Zurich').add(1, 'days');

    helper.printVerbose('Gather GitLab events: [', options.verbose);
    me.getUserEvents(auth, options)
        .then(function(events) {
            var projects = {};
            var targets = {};
            var list = Async.map(events, function(entry, entryCb) {
                var project = new Promise.resolve('xxx');
                if (entry.project_id) {
                    if (entry.project_id in projects) {
                        project = Promise.resolve(projects[entry.project_id].name);
                    } else {
                        project = me.getGitlabProject(auth, entry.project_id)
                            .then(function(project) {
                                projects[entry.id] = project;
                                return project.name;
                            })
                            .catch(function(err) {
                                entryCb('Error while fetching project from gitlab: ' + err);
                            });
                    }
                }
                var target = new Promise.resolve(null);
                if (entry.target_id) {
                    if (entry.target_id in targets) {
                        target = Promise.resolve(targets[entry.target_id]);
                    } else {
                        target = me.getGitlabTarget(auth, entry.target_type, entry.target_id, entry.project_id, entry)
                            .then(function(target) {
                                targets[entry.target_id] = target;
                                return target;
                            })
                            .catch(function(err) {
                                entryCb('Error while fetching target from gitlab: ' + err);
                            });
                    }
                }

                Promise.join(project, target, function(project, target) {
                    var text = me.eventDescription(entry, target);
                    var msg = {
                        'project': project,
                        'time': '1',
                        'text': text,
                        'timestamp': Moment.tz(entry.created_at, 'Europe/Zurich').startOf('day').format('X'),
                        'type': 'gitlab',
                        'comment': false
                    };
                    entryCb(null, msg);
                });
            },
            function(err, results) {
                helper.printVerbose(']', options.verbose);
                callback(err, _.flatten(results));
            });
        })
        .catch(function(err) {
            callback('The Gitlab API returned an error: ' + err);
        });
};

Gitlab.prototype.getUserEvents = function(auth, options) {
    var me = this;
    var startDateObj = Moment(options.startDate).tz('Europe/Zurich').subtract(1, 'days');
    var endDateObj = Moment(options.endDate).tz('Europe/Zurich').add(1, 'days');

    var events = [];
    var pager = function(res) {
        helper.printVerbose('.', options.verbose);
        events = events.concat(res.body);
        if (res.links.next) {
            return me.getNextPage(auth, res).then(pager);
        }
        return events;
    };

    return Request
        .get('https://gitlab.liip.ch/api/v3/events')
        .query({'after': startDateObj.format('YYYY-MM-DD')})
        .query({'before': endDateObj.format('YYYY-MM-DD')})
        .query({'sort': 'asc'})
        .query({'per_page': 100})
        .set('PRIVATE-TOKEN', auth)
        .then(pager);
};

Gitlab.prototype.getNextPage = function(auth, res) {
    return Request
        .get(res.links.next)
        .set('PRIVATE-TOKEN', auth);
};

Gitlab.prototype.getGitlabProject = function(auth, projectId) {
    return Request
        .get('https://gitlab.liip.ch/api/v3/projects/' + projectId)
        .set('PRIVATE-TOKEN', auth)
        .then(function(res) {
            return res.body;
        });
};

Gitlab.prototype.getGitlabTarget = function(auth, targetType, targetId, projectId, entry) {
    var me = this;
    targetType = targetType.toLowerCase();

    switch (targetType) {
        case 'mergerequest':
            return Request.get('https://gitlab.liip.ch/api/v3/projects/' + projectId + '/merge_requests/' + targetId)
                .set('PRIVATE-TOKEN', auth)
                .then(function(res) {
                    return {
                        'type': targetType,
                        'related': null,
                        'data': res.body
                    };
                });
       case 'issue':
            return Request.get('https://gitlab.liip.ch/api/v3/issues/' + targetId)
                .set('PRIVATE-TOKEN', auth)
                .then(function(res) {
                    return {
                        'type': targetType,
                        'related': null,
                        'data': res.body
                    };
                });
       case 'note':
       case 'diffnote':
            if (entry) {
                var realTargetType = entry.note.noteable_type;
                var realTargetId = entry.note.noteable_id;
                return me.getGitlabTarget(auth, realTargetType, realTargetId, projectId);
            }
            return Promise.reject('Error getting note target from gitlab');

       default:
            return Promise.reject("Unknown target type '" + targetType + "'");
    } 
};

Gitlab.prototype.eventDescription = function(entry, target) {
    var text;
    if (target) {
        switch (target.type) {
            case 'issue':
                text = '!' + target.data.iid + ': ' + entry.target_title + ', ' + entry.action_name + ' issue';
                break;
            case 'mergerequest':
                text = '!' + target.data.iid + ': ' + entry.target_title + ', ' + entry.action_name + ' merge request';
                break;
            case 'note':
            case 'diffnote':
                text = '!' + target.data.iid + ': ' + entry.target_title + ', ' + entry.action_name;
                break;

            default:
                text = target.type + ': ' + entry.action_name;
        }
    } else {
        text = entry.action_name + ' ' + (entry.data.ref ? entry.data.ref.replace('refs/heads/', 'branch ') : '');
    }
    return text;
};

module.exports = new Gitlab();
