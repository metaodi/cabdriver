var Gitconfig = require('git-config');
var Gitlog = require('gitlog');
var Findit = require('findit2');
var Path = require('path');
var Moment = require('moment-timezone');
var Async = require('async');
var _ = require('lodash');

var helper = require('./helper');

function Git() {}
Git.prototype.getCommits = function(callback, options) {
    var me = this;
    var path = options.git;
    if (!_.isString(path)) {
        path = '.';
    }
    var repoPaths = [];

    Async.parallel([
        function(cb) {
            me.getConfig(cb); 
        },
        function(cb) {
            var finder = Findit(path);

            // check for both files and directories
            // .git as directory = repository
            // .git as file = submodule
            helper.logVerbose("Find git repositories in " + Path.resolve(path) + ":", options.verbose);
            var errorMsgs = [];
            helper.printVerbose('[', options.verbose);
            finder.on('path', function (file, stat) {
                var base = Path.basename(file);
                if (base === '.git') {
                    helper.printVerbose('=', options.verbose);
                    var repoPath = Path.resolve(file, '..');
                    repoPaths.push(repoPath);
                }
            });
            finder.on('error', function(err) {
                if (err.path) {
                    helper.printVerbose("x", options.verbose);
                    errorMsgs.push("Error accessing path " + err.path);
                } else {
                    console.error(err);
                }
            });
            finder.on('end', function() {
                helper.printVerbose("]\n", options.verbose);
                _.each(errorMsgs, function(msg) {
                    helper.errorVerbose(msg, options.verbose);
                });
                cb(null, repoPaths);
            });
        },
        ],
        function(err, results) {
            if (err) {
                console.error(err);
                callback(err);
                return;
            }
            var gitConfig = results[0];
            var repoPaths = results[1];

            Async.map(repoPaths, function(repoPath, cb) {
                me.getCommitsFromRepository(gitConfig, repoPath, options.startDate, options.endDate, function(err, commits) {
                    cb(null, commits);
                });
            },
            function(err, results) {
                if (err) {
                    console.error(err);
                    callback(err);
                    return;
                }
                callback(null, _.flatten(results));
            });
        }
    );
};

Git.prototype.getCommitsFromRepository = function(config, repoPath, startDate, endDate, callback) {
    var me = this;
    var repo = Path.basename(repoPath);
    var options = { 
        repo: repoPath,
        number: 1000, 
        author: config.user.name,
        all: true,
        after: startDate,
        before: endDate,
        fields: [
            'abbrevHash',
            'subject',
            'authorName',
            'authorDate'
        ],
        execOptions: { 
            maxBuffer: 1000 * 1024
        }
    };

    me.getLog(options, function(error, commits) {
        callback(
            null,
            _.map(commits, function(commit) {
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
            })
        );
    });
};

Git.prototype.getConfig = function(callback) {
    Gitconfig(callback);
};

Git.prototype.getLog = function(options, callback) {
    Gitlog(options, callback);
};

module.exports = new Git();
