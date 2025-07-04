const express = require("express");
const router = express.Router();
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const wrapAsync = require("../utils/wrapAsync.js");

const listings = require("../models/listing");
router.get('/category/:category', async(req, res) => {
    console.log(req.params); 
    const category = req.params.category;
    const alisting = await listings.find({ category });
    console.log(alisting);
  
   
    res.render("../views/listings/category.ejs",{category,alisting});
  });


module.exports = router;
