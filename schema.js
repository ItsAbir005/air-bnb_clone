const Joi = require("joi");
// const review = require("./models/review"); // This import is unused and can be removed

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        price: Joi.number().required().min(0), // Added min(0) as price can't be negative
        country: Joi.string().required(),
        image: Joi.string().allow("", null), // Allow empty string or null for image URL
        category: Joi.string(),
    }).required(),
});


module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5), // *** CRITICAL FIX 1: Changed to Joi.number() and max(5) ***
        comment: Joi.string().required(),               // *** CRITICAL FIX 2: Changed to lowercase 'comment' ***
    }).required() // Add .required() for the 'review' object itself, as the form submits 'review'
});
