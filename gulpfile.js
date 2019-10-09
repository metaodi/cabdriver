var gulp   = require('gulp');
var eslint = require('gulp-eslint');
var exec = require('child_process').exec;

var scripts = [
    './**/*.js',
    '!./node_modules/**/*.js'
];

gulp.task('lint', function() {
    return gulp.src(scripts)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
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
