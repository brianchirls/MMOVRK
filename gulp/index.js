'use strict';

var fs = require('fs');
var taskFiles = fs.readdirSync('./gulp/tasks');
var gulp = require('gulp');
var tasks = {};

taskFiles.forEach(function(task) {
	var fn;

	task = task.replace(/\.js$/, '');

	fn = require('./tasks/' + task);;
	tasks[task] = fn;

	gulp.task(task, fn);
});

gulp.task('watch', function () {
	tasks.dev();
	tasks.watch();
});
gulp.task('default', tasks.dev);
