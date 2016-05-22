var gulp = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sass = require("gulp-sass");


// 语法检查
gulp.task('jshint', function() {
    return gulp.src('src/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});


// 合并文件之后压缩代码
gulp.task('minify', function() {
    return gulp.src('src/js/*.js')
        .pipe(concat('JinUI.js'))
        .pipe(gulp.dest('dist'))
        .pipe(uglify())
        .pipe(rename('JinUI.min.js'))
        .pipe(gulp.dest('dist'));
});

//编译scss文件
gulp.task("scss", function() {
    return gulp.src('src/scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('src/css'))
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(rename('JinUI.min.css'))
        .pipe(gulp.dest('dist'));
});

// 监视文件的变化
gulp.task('watch', function() {
    gulp.watch('src/js/*.js', ['jshint', 'minify']);

    gulp.watch('src/scss/*.scss',['scss']);
});



// 注册缺省任务
gulp.task('default', ['jshint', 'minify','scss', 'watch']);

gulp.task('dist', ['jshint', 'minify','scss'])
