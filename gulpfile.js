var gulp   = require('gulp');
var jshint = require('gulp-jshint');
var gulp   = require('gulp');
var jscs = require('gulp-jscs');
var exec = require('child_process').exec;

var scripts = [
    './**/*.js',
    '!./node_modules/**/*.js',
    '!./coverage/**/*.js'
];

gulp.task('lint', function() {
    return gulp.src(scripts)
        .pipe(jshint('./.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'))
        .pipe(jscs());
});

gulp.task('test', function(cb) {
    exec('npm test', function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('testcoverage', function(cb) {
    exec('npm coverage', function(err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('default', gulp.series('lint'));
gulp.task('travis', gulp.series('lint', 'test'));
