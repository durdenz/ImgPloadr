var	Stats = require('./stats'),
	Images = require('./images'),
	Comments = require('./comments'),
	async = require('async');

module.exports = function(viewModel, callback) {
	async.parallel([
		function(next) {
			console.log('Calling Stats()');
			Stats(next);
		},
		function(next) {
			console.log('Calling Images.popular()');
			Images.popular(next);
		},
		function(next) {
			console.log('Calling Comments.newest(next)');
			Comments.newest(next);
		}
	], function (err, results) {
			console.log('Sidebar.js - callback function invoked');
			viewModel.sidebar = {
			stats: results[0],
			popular: results[1],
			comments: results[2]
			};

			callback(viewModel);
		});	
};