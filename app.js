if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const methodoverride = require("method-override");
const path = require("path");
const ExpressError = require("./utils/ExpressError.js");
const ejsMate = require("ejs-mate");
const listings = require("./models/listing.js"); // Make sure this is imported correctly

const ListingRouter = require("./routes/listing.js");
const categoryRouter = require("./routes/category.js"); // Check if this is used or remove if not
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const searchRouter = require("./routes/search.js");

const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

app.use(methodoverride("_method"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const sessionOption = {
  secret: process.env.SECRET || "mysupersecrtecode", // Use process.env.SECRET here too
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOption));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// ROUTERS
app.use("/listings", ListingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/", categoryRouter); // Check if this router is actually defining any routes
app.use("/search", searchRouter);

// DATABASE CONNECTION
const dbUrl = process.env.MONGO_URI; // Get the MongoDB URI from environment variables

async function main() {
  try {
    await mongoose.connect(dbUrl); // Use the dbUrl from environment variables
    console.log("Successfully connected to MongoDB Atlas"); // Changed log for clarity
  } catch (err) {
    console.error("MongoDB Atlas connection error:", err);
    // It's crucial to handle this error; exiting is one way for critical errors
    process.exit(1); // Exit if unable to connect to DB
  }
}

main()
  .then(() => {
    // This part runs after main() finishes
    console.log("MongoDB connection attempt complete (check logs for success/failure)");
  })
  .catch((err) => console.log("Unhandled promise rejection during DB connection:", err));


// ROOT ROUTE (Added for clarity if you don't have one in ListingRouter)
// If you have a '/' route in ListingRouter or elsewhere, this might be redundant.
// But it's good to ensure there's a fallback for the root.
app.get("/", (req, res) => {
    res.redirect("/listings"); // Redirect to your main listings page
});


// ERROR HANDLING (Must be after all other app.use and routes)
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not Found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err; // Default to 500 for server errors
  res.status(statusCode).render("error.ejs", { message });
});

// START SERVER
app.listen(process.env.PORT || 3003, () => { // Use process.env.PORT for Render
  console.log(`server started on port ${process.env.PORT || 3003}`);
});
