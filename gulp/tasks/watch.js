'use strict';

var gulp = require('gulp');
var config = require('../../config');

module.exports = function () {
	gulp.watch(['src/**/*', 'config/*'], ['dev']);
};