// routes/review.js (This is the one you provided. Note the singular 'review.js' filename)
const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
let { reviewSchema } = require("../schema.js");
const { isLoggedIn, isReviewauthor } = require("../middleware.js");
let ReviewController = require("../controller/reviews.js"); // Check this path!

const validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        req.flash("error", errMsg);
        const listingId = req.params.id;
        return res.redirect(`/listings/${listingId}`); // CRITICAL: 'return' is here
    } else {
        next();
    }
}

router.post(
  "/",
  isLoggedIn,
  validateReview,
  wrapAsync(ReviewController.createReview)
);

router.delete(
  "/:reviewId",
  isLoggedIn,
  isReviewauthor,
  wrapAsync(ReviewController.deleteReview)
);

module.exports = router;