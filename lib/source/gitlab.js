'use strict';

var Moment = require('moment-timezone');
var Request = require('superagent');
var Async = require('promise-async');
var Promise = require('bluebird');
var _ = require('lodash');

var helper = require('../helper');
var Source = require('./source');

class Gitlab extends Source {
    constructor(options, auth) {
        super(options, auth);
        this.type = 'gitlab';
    }

    // eslint-disable-next-line max-lines-per-function 
    generateEntries(auth) {
        var me = this;

        helper.printVerbose('Gather GitLab events: [', me.options.verbose);
        return me.getUserEvents(auth)
            // eslint-disable-next-line max-lines-per-function 
            .then(function(events) {
                var projects = {};
                var targets = {};
                // eslint-disable-next-line max-lines-per-function 
                return Async.map(events, function(entry, entryCb) {
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
                            target = me.getGitlabTarget(
                                auth,
                                entry.target_type,
                                entry.target_iid,
                                entry.project_id, entry
                            )
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
                });
            })
            .then(function(results) {
                helper.printVerbose(']', me.options.verbose);
                return _.flatten(results);
            })
            .catch(function(err) {
                throw new Error('The Gitlab API returned an error: ' + err);
            });
    }

    getUserEvents(auth) {
        var me = this;
        var startDateObj = Moment(me.options.startDate).tz('Europe/Zurich').subtract(1, 'days');
        var endDateObj = Moment(me.options.endDate).tz('Europe/Zurich').add(1, 'days');

        var events = [];
        var pager = function(res) {
            helper.printVerbose('.', me.options.verbose);
            events = events.concat(res.body);
            if (res.links.next) {
                return me.getNextPage(auth, res).then(pager);
            }
            return events;
        };

        return Request
            .get('https://gitlab.liip.ch/api/v4/events')
            .query({'after': startDateObj.format('YYYY-MM-DD')})
            .query({'before': endDateObj.format('YYYY-MM-DD')})
            .query({'sort': 'asc'})
            .query({'per_page': 100})
            .set('PRIVATE-TOKEN', auth)
            .then(pager);
    }

    getNextPage(auth, res) {
        return Request
            .get(res.links.next)
            .set('PRIVATE-TOKEN', auth);
    }

    getGitlabProject(auth, projectId) {
        return Request
            .get('https://gitlab.liip.ch/api/v4/projects/' + projectId)
            .set('PRIVATE-TOKEN', auth)
            .then(function(res) {
                return res.body;
            });
    }

    // eslint-disable-next-line max-lines-per-function, complexity
    getGitlabTarget(auth, targetType, targetIid, projectId, entry) {
        var me = this;
        targetType = targetType.toLowerCase();

        switch (targetType) {
        case 'mergerequest':
            return Request.get('https://gitlab.liip.ch/api/v4/projects/' + projectId + '/merge_requests/' + targetIid)
                .set('PRIVATE-TOKEN', auth)
                .then(function(res) {
                    return {
                        'type': targetType,
                        'related': null,
                        'data': res.body
                    };
                });
        case 'issue':
            return Request.get('https://gitlab.liip.ch/api/v4/projects/' + projectId + '/issues/' + targetIid)
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
                var realTargetIid = entry.note.noteable_iid;
                return me.getGitlabTarget(auth, realTargetType, realTargetIid, projectId);
            }
            return Promise.reject('Error getting note target from gitlab');

        default:
            return Promise.reject('Unknown target type \'' + targetType + '\'');
        } 
    }

    // eslint-disable-next-line complexity
    eventDescription(entry, target) {
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
            text = entry.action_name + ' ';
            if (entry.push_data) {
                text += entry.push_data.ref_type + ' ';
                text += entry.push_data.ref;
            }
        }
        return text;
    }
}

module.exports = Gitlab;
