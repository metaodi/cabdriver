"use strict";

var Gitconfig = require('git-config');
var Gitlog = require('gitlog');
var Findit = require('findit2');
var Path = require('path');
var Moment = require('moment-timezone');
var Async = require('promise-async');
var Promise = require('bluebird');
var _ = require('lodash');

var helper = require('./helper');
var Source = require('./source');

class Git extends Source {
    constructor(options, auth, gitlog, gitconfig) {
        super(options, auth);
        this.type = 'git';
        this.gitlog = gitlog || Promise.promisify(Gitlog);
        this.gitconfig = gitconfig || Gitconfig;
    }

    generateEntries(auth) {
        var me = this;
        var path = me.options.git;
        if (!_.isString(path)) {
            path = '.';
        }
        var repoPaths = [];

        return Async.parallel([
            function(cb) {
                me.gitconfig(cb); 
            },
            function(cb) {
                helper.logVerbose("Find git repositories in " + Path.resolve(path) + ":", me.options.verbose);
                helper.printVerbose('[', me.options.verbose);
                var cacheResult = me.options.cache.getSync('git-repo-paths');
                if (cacheResult) {
                    helper.printVerbose("loaded from cache]\n", me.options.verbose);
                    cb(null, cacheResult);
                    return;
                }
                var finder = Findit(path);

                // check for both files and directories
                // .git as directory = repository
                // .git as file = submodule
                var errorMsgs = [];
                finder.on('path', function (file, stat) {
                    var base = Path.basename(file);
                    if (base === '.git') {
                        helper.printVerbose('=', me.options.verbose);
                        var repoPath = Path.resolve(file, '..');
                        repoPaths.push(repoPath);
                    }
                });
                finder.on('error', function(err) {
                    if (err.path) {
                        helper.printVerbose("x", me.options.verbose);
                        errorMsgs.push("Error accessing path " + err.path);
                    } else {
                        helper.errorVerbose(err);
                    }
                });
                finder.on('end', function() {
                    helper.printVerbose("]\n", me.options.verbose);
                    _.each(errorMsgs, function(msg) {
                        helper.errorVerbose(msg, me.options.verbose);
                    });
                    me.options.cache.putSync('git-repo-paths', repoPaths);
                    cb(null, repoPaths);
                });
            },
       ])
       .then(function(results) {
            var gitConfig = results[0];
            var repoPaths = results[1];

            return Promise.all(
                _.map(repoPaths, function(repoPath) {
                    return me.getCommitsFromRepository(gitConfig, repoPath, me.options.startDate, me.options.endDate, me.options.verbose);
                })
            );
        })
        .then(function(results) {
            results = _.flatten(results);
            results = _.filter(results, function(n) { return n !== undefined; });
            return results;
        })
        .catch(function(err) {
            throw new Error('An error occured while getting the git commits: ' + err);
        });
    }

    getCommitsFromRepository(config, repoPath) {
        var me = this;
        var startDate = Moment.tz(me.options.startDate, 'Europe/Zurich').subtract(1, 'd').endOf('day').toISOString();
        var repo = Path.basename(repoPath);
        var options = { 
            repo: repoPath,
            number: 1000, 
            author: config.user.name,
            all: true,
            after: startDate,
            before: me.options.endDate,
            fields: [
                'abbrevHash',
                'subject',
                'authorName',
                'authorDate'
            ]
        };

        return me.gitlog(options)
            .then(function(commits) {
                return _.map(commits, function(commit) {
                    //gitlog uses a custom format with @end@ at the end, get rid of it
                    commit.authorDate = commit.authorDate.replace('@end@', '').trim();
                    var msg = {
                        'project': repo,
                        'time': '',
                        'text': commit.subject,
                        'timestamp': Moment.tz(commit.authorDate, 'Europe/Zurich').startOf('day').format('X'),
                        'comment': false,
                        'type': 'git'
                    };
                    return msg;
                });
            })
            .catch(function(err) {
                if (err.message && err.message.match(/your current branch '.*' does not have any commits yet/)) {
                    helper.logVerbose("Skipping repo '" + repo + "', it has no commits yet", me.options.verbose);
                } else {
                    throw new Error("Could fetch commits from repo " + repo + ": " + err);
                }
            });
    }
}

module.exports = Git;
