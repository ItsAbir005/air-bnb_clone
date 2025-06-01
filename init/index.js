// init/index.js
const mongoose = require("mongoose");
const Listing = require("../models/listing.js"); // Renamed 'listing' to 'Listing' for clarity
const initData = require("./data.js");
const User = require("../models/user.js");
const Review = require("../models/review.js"); // Import your Review model

main().then(() => {
    console.log("Successfully connected to MongoDB for seeding.");
    initDB(); // Call initDB AFTER successful connection
}).catch(err => {
    console.error("MongoDB connection error during seeding:", err);
});

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

const initDB = async () => {
    try {
        // --- 1. Clean and Seed Users ---
        await User.deleteMany({}); // Clear existing users
        console.log("Existing users cleared.");

        let sampleUser = new User({
            email: "testuser@example.com",
            username: "testuser"
        });
        let registeredUser = await User.register(sampleUser, "testpassword"); // Use a simple password for seeding

        console.log("Default user registered:", registeredUser.username, "with ID:", registeredUser._id);

        // --- 2. Clean and Seed Listings using the new user's ID ---
        await Listing.deleteMany({}); // Clear existing listings
        console.log("Existing listings cleared.");

        let listingsToInsert = initData.data.map((obj) => ({
            ...obj,
            owner: registeredUser._id, // Assign the _id of the dynamically created user
            reviews: [] // Initialize an empty array for reviews on the listing
        }));
        await Listing.insertMany(listingsToInsert);
        console.log("Listings initialized. Number of listings inserted:", listingsToInsert.length);

        // --- Debugging: Verify listings are found after insertion ---
        const allListings = await Listing.find({}); // Fetch all listings AFTER they've been inserted
        console.log("Number of listings found after find():", allListings.length);

        if (allListings.length === 0) {
            console.error("CRITICAL ERROR: No listings found after insertion. Reviews cannot be linked. Please check your Listing schema or data.js for validation issues.");
            return; // Stop execution if no listings are found
        }
        console.log("First listing ID found:", allListings[0]._id);
        console.log("Second listing ID found:", allListings[1] ? allListings[1]._id : "N/A");
        console.log("Third listing ID found:", allListings[2] ? allListings[2]._id : "N/A");


        // --- 3. Clean and Seed Reviews, then associate them with listings ---
        await Review.deleteMany({}); // Clear existing reviews
        console.log("Existing reviews cleared.");

        // Create some sample reviews and assign them to listings and the registered user
        // Ensure you have enough listings in 'allListings' for these indices
        const sampleReviews = [
            {
                comment: "Absolutely breathtaking! Loved every moment.",
                rating: 5,
                author: registeredUser._id,
                listing: allListings[0] ? allListings[0]._id : undefined // Assign to the first listing found
            },
            {
                comment: "A decent place, good value for money.",
                rating: 3,
                author: registeredUser._id,
                listing: allListings[1] ? allListings[1]._id : undefined // Assign to the second listing found
            },
            {
                comment: "The view was amazing, but service could be better.",
                rating: 4,
                author: registeredUser._id,
                listing: allListings[0] ? allListings[0]._id : undefined // Assign another review to the first listing
            },
            {
                comment: "Cozy and comfortable, exactly what I needed.",
                rating: 4,
                author: registeredUser._id,
                listing: allListings[2] ? allListings[2]._id : undefined // Assign to the third listing
            },
            {
                comment: "Disappointing experience, not as advertised.",
                rating: 2,
                author: registeredUser._id,
                listing: allListings[3] ? allListings[3]._id : undefined // Assign to the fourth listing
            },
            // Add more sample reviews as needed, linking them to specific listing IDs
        ];

        // Filter out reviews where listing ID couldn't be assigned
        const validSampleReviews = sampleReviews.filter(review => review.listing !== undefined);

        if (validSampleReviews.length === 0) {
            console.warn("No valid reviews to insert after checking listing IDs. Check your allListings array and sampleReviews assignments.");
            return; // Exit if no valid reviews can be created
        }

        const createdReviews = await Review.insertMany(validSampleReviews);
        console.log("Reviews initialized. Number of reviews created:", createdReviews.length);

        // Associate the created reviews with their respective listings
        for (let review of createdReviews) {
            const targetListing = await Listing.findById(review.listing);
            if (targetListing) {
                targetListing.reviews.push(review._id); // Push the review's _id into the listing's reviews array
                await targetListing.save(); // Save the updated listing
            } else {
                console.warn(`Listing with ID ${review.listing} not found for review ${review._id}. This review might not be linked.`);
            }
        }
        console.log("Reviews linked to listings.");

    } catch (error) {
        console.error("Error during database initialization:", error);
    }
};
