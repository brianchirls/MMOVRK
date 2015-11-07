'use strict';

var gulp = require('gulp');
var webpack = require('gulp-webpack');

module.exports = function () {
	var config = require('../../config');

	return gulp.src('src/js/index.js')
		.pipe(webpack(config.dev))
		.pipe(gulp.dest('dist/js'));
};