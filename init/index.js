// init/index.js
if (process.env.NODE_ENV != "production") {
    require("dotenv").config(); // Add this line to load .env variables
}

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const initData = require("./data.js");
const User = require("../models/user.js");
const Review = require("../models/review.js");

// Define dbUrl using the environment variable
const dbUrl = process.env.MONGO_URI;

main().then(() => {
    console.log("Successfully connected to MongoDB for seeding.");
    initDB(); // Call initDB AFTER successful connection
}).catch(err => {
    console.error("MongoDB connection error during seeding:", err);
});

async function main() {
    await mongoose.connect(dbUrl); // Use dbUrl here
}

const initDB = async () => {
    try {
        // --- 1. Clean and Seed Users ---
        await User.deleteMany({});
        console.log("Existing users cleared.");

        let sampleUser = new User({
            email: "testuser@example.com",
            username: "testuser"
        });
        let registeredUser = await User.register(sampleUser, "testpassword");

        console.log("Default user registered:", registeredUser.username, "with ID:", registeredUser._id);

        // --- 2. Clean and Seed Listings using the new user's ID ---
        await Listing.deleteMany({});
        console.log("Existing listings cleared.");

        let listingsToInsert = initData.data.map((obj) => ({
            ...obj,
            owner: registeredUser._id,
            reviews: []
        }));
        await Listing.insertMany(listingsToInsert);
        console.log("Listings initialized. Number of listings inserted:", listingsToInsert.length);

        const allListings = await Listing.find({});
        console.log("Number of listings found after find():", allListings.length);

        if (allListings.length === 0) {
            console.error("CRITICAL ERROR: No listings found after insertion. Reviews cannot be linked. Please check your Listing schema or data.js for validation issues.");
            return;
        }
        console.log("First listing ID found:", allListings[0]._id);
        console.log("Second listing ID found:", allListings[1] ? allListings[1]._id : "N/A");
        console.log("Third listing ID found:", allListings[2] ? allListings[2]._id : "N/A");

        // --- 3. Clean and Seed Reviews, then associate them with listings ---
        await Review.deleteMany({});
        console.log("Existing reviews cleared.");

        const sampleReviews = [
            {
                comment: "Absolutely breathtaking! Loved every moment.",
                rating: 5,
                author: registeredUser._id,
                listing: allListings[0] ? allListings[0]._id : undefined
            },
            {
                comment: "A decent place, good value for money.",
                rating: 3,
                author: registeredUser._id,
                listing: allListings[1] ? allListings[1]._id : undefined
            },
            {
                comment: "The view was amazing, but service could be better.",
                rating: 4,
                author: registeredUser._id,
                listing: allListings[0] ? allListings[0]._id : undefined
            },
            {
                comment: "Cozy and comfortable, exactly what I needed.",
                rating: 4,
                author: registeredUser._id,
                listing: allListings[2] ? allListings[2]._id : undefined
            },
            {
                comment: "Disappointing experience, not as advertised.",
                rating: 2,
                author: registeredUser._id,
                listing: allListings[3] ? allListings[3]._id : undefined
            },
        ];

        const validSampleReviews = sampleReviews.filter(review => review.listing !== undefined);

        if (validSampleReviews.length === 0) {
            console.warn("No valid reviews to insert after checking listing IDs. Check your allListings array and sampleReviews assignments.");
            return;
        }

        const createdReviews = await Review.insertMany(validSampleReviews);
        console.log("Reviews initialized. Number of reviews created:", createdReviews.length);

        for (let review of createdReviews) {
            const targetListing = await Listing.findById(review.listing);
            if (targetListing) {
                targetListing.reviews.push(review._id);
                await targetListing.save();
            } else {
                console.warn(`Listing with ID ${review.listing} not found for review ${review._id}. This review might not be linked.`);
            }
        }
        console.log("Reviews linked to listings.");

    } catch (error) {
        console.error("Error during database initialization:", error);
    }
};