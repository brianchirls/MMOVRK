module.exports = (function () {
	'use strict';

	var assign = require('object-assign');
	var webpack = require('webpack');
	var pkg = require('../package.json');

	var banner = [
		pkg.name + ' - ' + pkg.description,
		'@version v' + pkg.version,
		'@link ' + pkg.homepage,
		'@license ' + pkg.license
	].join('\n');

	var common = {
		// entry: './src/entry.js',
		module: {
			preLoaders: [
				{
					test: /\.js$/,
					exclude: /node_modules|bower_components|src\/js\/lib/,
					loader: 'jshint-loader'
				}
			],
			loaders: [
				{
					test: /\.js$/,
					exclude: /node_modules/,
					loader: 'babel-loader'
				},
				{
					test: /\.js$/,
					exclude: /node_modules|bower_components/,
					loader: 'exports-loader'
				}
			]
		},

		resolve: {
			modulesDirectories: ['node_modules', 'src/js/lib']
		},

		jshint: assign({
			failOnHint: true,
			emitErrors: true
		}, pkg.jshintConfig)
	};

	var exports = {};

	exports.dev = assign({}, common, {
		debug: true,
		devtool: 'eval', //sourcemap?
		output: {
			filename: 'index.js',
			pathInfo: true
		},
		jshint: assign({}, common.jshint, {
			unused: false
		})
	});

	exports.production = assign({}, common, {
		// devtool: 'source-map',
		output: {
			filename: 'index.js',
			sourceMapFilename: '[file].map'
		},
		plugins: [
			new webpack.optimize.DedupePlugin(),
			new webpack.optimize.UglifyJsPlugin({
				compress: {
					warnings: false
				},
			}),
			new webpack.BannerPlugin(banner)
		],
	});

	return exports;
}());