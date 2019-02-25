// image.js
//
var	express = require('express'),
	multer = require('multer'),
	fs = require('fs'),
	path = require('path');

//var router = express.Router;

var	sidebar = require('../helpers/sidebar');
var Models = require('../models');
var	md5 = require('MD5');

module.exports = {
	index: function(req, res) {
		var viewModel = {
			image: {} ,
			comments: []
		};

		Models.Image.findOne({ filename: { $regex: req.params.image_id }},
			function (err, image) {
				if (err) {throw err;}
				if (image) {
					// Image was found
					image.views = image.views + 1;
					viewModel.image = image;
					image.save();

					// find any comments with same image_id as the image
					Models.Comment.find({ image_id: image._id }, {}, { sort: {'timestamp' : 1 }}, 
						function(err, comments) {
							if (err) { throw err; }
							viewModel.comments = comments;

							sidebar(viewModel, function(viewModel) {
								res.render('image', viewModel);
							});
						});
				} else {
					res.redirect('/');
				}
			});
	},
	create: function(req, res) {
		var saveImage = function() {
			
			//	console.log('Entering saveImage()');
			//	console.log(req.files);
			//	console.log('F2: ');
			//	console.log(req.files[0]);

			var possible = 'abcdefghijklmnopqrstuvwxyz0123456789',
				imgUrl = '';

			for(var i=0; i < 6; i+=1) {
				imgUrl += possible.charAt(Math.floor(Math.random() * possible.length));
			}

			// search for an image with the same filename by performing a find:
			Models.Image.find({ filename: imgUrl }, function(err, images) {
				if (images.length > 0) {
					// if a matching image was found, try again (start over):
					saveImage();
				} else {
					console.log('file: ' + req.files[0].filename);
					console.log('path: ' + req.files[0].path);
					console.log('originalname: ' + req.files[0].originalname);

					var tempPath = req.files[0].path,
						ext = path.extname(req.files[0].originalname).toLowerCase(),
						targetPath = path.resolve('./public/upload/' + imgUrl + ext);

					if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif') {
						fs.rename(tempPath, targetPath, function(err) {
							if (err) { throw err; } 

							// create a new Image model , populate its details:
							var newImg = new Models.Image({
								title: 		req.body.title,
								filename: 	imgUrl + ext,
								description: req.body.description
								});
							// and save the new image
							newImg.save(function(err, image) {
								res.redirect('/images/' + image.uniqueId);
							});
						});
					} else {
						fs.unlink( tempPath, function() { 
								if (err) { throw err; }
								res.json(500, {error: 'Only image files are allowed.'});
						});
					}
				}
			});
		};
		saveImage();
	},
	like: function(req, res) {
		//res.send('The image:like POST controller');
		//console.log('req.body: ' + req.body);
		Models.Image.findOne({ filename: { $regex: req.params.image_id } }, 
			function(err, image) {
				if (!err && image) {
					image.likes = image.likes + 1;
					image.save( function(err) {
						if (err) {
							res.json(err);
						} else {
							res.json({ likes: image.likes });
						}
					});
				}
			});
	},
	comment: function(req, res) {
		// res.send('The image:comment POST controller');
		// console.log('req.body: ' + req.body);
		Models.Image.findOne({ filename: { $regex: req.params.image_id } }, 
		function(err, image) {
			if (!err && image) {
				var newComment = new Models.Comment(req.body);
				// console.log('req.body: ' + req.body);
				newComment.gravatar = md5(newComment.email);
				newComment.image_id = image._id;
				// console.log('email: ' + newComment.email);
				// console.log('name: ' + newComment.name);
				// console.log('gravatar: ' + newComment.gravatar);
				// console.log('image_id: ' + newComment.image_id);
				newComment.save(function(err, comment) {
					if (err) { throw err }
					// console.log('/images/' + image.uniqueId + '#' + comment._id);
					res.redirect('/images/' + image.uniqueId + '#' + comment._id);
				});
			} else {
				res.redirect('/');
			}
		});
	},
	remove: function(req, res) {
		Models.Image.findOne({ filename: { $regex: req.params.image_id } },
			function(err, image) {
				if (err) { throw err; }

				console.log('Deleting file ' + image.filename);  // debug

				fs.unlink(path.resolve('./public/upload/' + image.filename), 
					function(err) {
						if (err) { throw err; }

						Models.Comment.remove({ image_id: image._id}, 
							function(err) {
								image.remove(function(err) {
									if (!err) {
										res.json(true);
									} else {
										res.json(false);
									}
								});
							}
						);
					}
				);
			}
		);
	}
};