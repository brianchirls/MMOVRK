'use strict';

var del = require('del');

module.exports = function (cb) {
	del([
		'dist/js'
	], cb);
};
