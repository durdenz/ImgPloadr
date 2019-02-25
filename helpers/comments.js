
var models = require('../models'),
	async = require('async');

module.exports = {
	newest: function(callback) {
		// to do...
		console.log('Inside newest()'); // debug

		models.Comment.find({}, {}, { limit: 5, sort: {'timestamp': -1} },
			function(err, comments) {
				// to do - attach an image to each comment...
				var attachImage = function(comment, next) {
					console.log('Entering attachImage()'); // debug

					models.Image.findOne({ _id : comment.image_id },
						function(err, image) {

							console.log('models.Image.findone invoked. err = ' + err); // debug
							console.log('image = ' + image); // debug

							if (err) throw err;

							console.log('Before: comment.image = ' + comment.image);
							comment.image = image;
							console.log('After: comment.image = ' + comment.image);


							console.log('calling next(err)  err = ' + err);  // debug

							next(err);
						});
				};
				console.log('Inside Newest() comments = ' + comments); // debug

				async.each(comments, attachImage, function(err) {
					console.log('async.each complete err = ' + err); // debug

					if (err) throw err;

					callback(err, comments);
				});
			});
	}
};