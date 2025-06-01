// controllers/reviews.js (This is the one you provided. Note the plural 'reviews.js' filename)
const Review = require("../models/review.js");
const Listing = require("../models/listing.js"); // Changed to 'Listing' (uppercase) for consistency

module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review); // Removed 'await' here as it's not needed for instance creation
    newReview.author = req.user._id;
    newReview.listing = listing._id; // CRITICAL FIX: Assigning listing ID to review
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    req.flash("success", "New Review Created!");
    return res.redirect(`/listings/${listing._id}`); // Added return
}

module.exports.deleteReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted!");
    return res.redirect(`/listings/${id}`); // Added return
}