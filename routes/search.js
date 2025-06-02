const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");

const listings = require("../models/listing");

router.post("/", wrapAsync(async (req, res) => {
    const nameQuery = req.body.search;
    console.log("Search query:", nameQuery);
    const results = await listings.find({
        $or: [
            { title: new RegExp(nameQuery, "i") },       // Search in title
            { description: new RegExp(nameQuery, "i") }, // Search in description
            { location: new RegExp(nameQuery, "i") },    // Search in location
            { country: new RegExp(nameQuery, "i") },     // Search in country
            { category: new RegExp(nameQuery, "i") }     // Search in category (if implemented)
        ]
    });
    console.log("Search results:", results);

    // ADD 'return' HERE:
    return res.render("../views/listings/search.ejs", { results });
}));

module.exports = router;