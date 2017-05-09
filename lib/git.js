var Gitconfig = require('git-config');
var Gitlog = require('gitlog');
var Findit = require('findit2');
var Path = require('path');
var Moment = require('moment-timezone');
var Async = require('async');
var _ = require('lodash');

var helper = require('./helper');

exports.getCommits = getCommits;

function getCommits(callback, options) {
    var path = options.git;
    if (!_.isString(path)) {
        path = '.';
    }
    var repoPaths = [];

    Async.parallel([
        function(cb) {
            Gitconfig(cb); 
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
            var gitConfig = results[0];
            var repoPaths = results[1];

            Async.map(repoPaths, function(repoPath, cb) {
                getCommitsFromRepository(gitConfig, repoPath, options.startDate, options.endDate, function(err, commits) {
                    cb(null, commits);
                });
            },
            function(err, results) {
                callback(null, _.flatten(results));
            });
        }
    );
}

function getCommitsFromRepository(config, repoPath, startDate, endDate, callback) {
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

    Gitlog(options, function(error, commits) {
        callback(
            null,
            _.map(commits, function(commit) {
                //gitlog uses a custom format with @end@ at the end, get rid of it
                commit.authorDate = commit.authorDate.replace('@end@', '').trim();
                var msg = {
                    'project': repo,
                    'time': '',
                    'text': commit.subject,
                    'timestamp': Moment(commit.authorDate).startOf('day').format('X'),
                    'comment': false,
                    'type': 'git'
                };
                return msg;
            })
        );
    });
}
