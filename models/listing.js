
const { ref, string } = require("joi");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const Review = require("./review.js");



const listingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            require: true
        },
        description: {
            type: String,
            require: true
        },
        image: {
            url: String,
            filename: String,
        },
        price: {
            type: Number,
            require: true
        },
        location: {
            type: String,
            require: true
        },
        country: {
            type: String,
            require: true
        },
        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        geometry: {
            type: { type: String, enum: ['Point'] },
            coordinates: { type: [Number] }, 
        },
        category: {
            type: String,


        },

    }
);

listingSchema.post("findOneAndDelete", async (listing) => {

    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }


})

const listing = mongoose.model("listing", listingSchema);

module.exports = listing;

