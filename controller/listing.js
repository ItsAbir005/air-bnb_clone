const { query } = require("express"); 
const listings = require("../models/listing"); 


module.exports.index = async (req, res) => {
    const { category } = req.query; // Extract the 'category' query parameter

    let allListing;
    if (category) {
        // If a category is provided in the query, filter listings by that category
        // Ensure your listing model has a 'category' field for this to work
        allListing = await listings.find({ category: category });
    } else {
        // If no category is provided, fetch all listings
        allListing = await listings.find({});
    }
    res.render("../views/listings/index.ejs", { allListing });
}

module.exports.rendernewForm = async (req, res) => {
    res.render("listings/form.ejs");
};

module.exports.showsallListings = async (req, res) => {
    let { id } = req.params;
    const listing = await listings.findById(id).populate({ path: "reviews", populate: { path: "author", } }).populate("owner");
    if (!listing) {
        req.flash("error", " Listing you are requested for does not exist");
        return res.redirect("/listings");
    }
    res.render("../views/listings/show.ejs", { listing });
}

module.exports.rendereditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await listings.findById(id);
    if (!listing) {
        req.flash("error", " Listing you are requested for does not exist");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/uplaod/w_150,h_100");
    res.render("../views/listings/edit.ejs", { listing, originalImageUrl });
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await listings.findByIdAndUpdate(id, { ...req.body.listing });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    req.flash("success", " listing update successfully");
    res.redirect("/listings");
}

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    await listings.findByIdAndDelete(id);
    req.flash("success", " listing Deleted");
    res.redirect("/listings");
}

module.exports.createListing = async (req, res, next) => {
    // Removed Mapbox geocoding

    let url = req.file.path;
    let filename = req.file.filename;

    let Listing = new listings(req.body.listing);
    Listing.owner = req.user._id;
    Listing.image = { url, filename };

    // Remove geometry field or set default/null if required:
    Listing.geometry = null;  // Or delete this line if schema allows

    let savedListing = await Listing.save();
    console.log(savedListing);
    req.flash("success", "new listing successfully created");
    res.redirect("/listings");
}
