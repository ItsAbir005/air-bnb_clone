if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose"); // mongoose is declared here
const methodoverride = require("method-override");
const path = require("path");
const ExpressError = require("./utils/ExpressError.js");
const ejsMate = require("ejs-mate");
const listings = require("./models/listing.js");

const ListingRouter = require("./routes/listing.js");
const categoryRouter = require("./routes/category.js");
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
  secret: process.env.SECRET || "mysupersecrtecode",
  resave: false,
  saveUninitialized: false, // Better security
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
app.use("/", categoryRouter);
app.use("/search", searchRouter);

// DATABASE CONNECTION - Now mongoose is available
const dbUrl = process.env.MONGO_URI;

const mongooseOptions = {
  serverSelectionTimeoutMS: 60000, // 60 seconds
  socketTimeoutMS: 45000,
  family: 4, // Force IPv4
  maxPoolSize: 10,
  retryWrites: true
};

// Connection event listeners (after mongoose is declared)
mongoose.connection.on('connecting', () => {
  console.log('🔄 Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB Atlas');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

async function connectToDatabase() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string format:', dbUrl ? 'Found' : 'Missing');
    
    if (!dbUrl) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    
    await mongoose.connect(dbUrl, mongooseOptions);
    console.log("✅ Successfully connected to MongoDB Atlas");
    return true;
  } catch (err) {
    console.error("❌ MongoDB Atlas connection error:", err.message);
    
    // Specific error handling
    if (err.message.includes('ETIMEOUT') || err.message.includes('querySrv')) {
      console.log('🔍 DNS/Network issue detected. Try these solutions:');
      console.log('1. Change DNS to 8.8.8.8 and 8.8.4.4');
      console.log('2. Check Windows Firewall settings');
      console.log('3. Try using standard MongoDB connection string (not SRV)');
      console.log('4. Check if your IP is whitelisted in MongoDB Atlas');
      console.log('5. Try connecting with MongoDB Compass first');
    }
    
    return false;
  }
}

// ROOT ROUTE
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// ERROR HANDLING
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not Found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  
  // Log errors for debugging
  if (statusCode === 500) {
    console.error('Server Error:', err);
  }
  
  res.status(statusCode).render("error.ejs", { message });
});

// Start server only after database connection
async function startServer() {
  console.log('🚀 Starting Wanderlust application...');
  
  const dbConnected = await connectToDatabase();
  
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Server not started.');
    console.log('💡 Please check your MongoDB Atlas connection and try again.');
    process.exit(1);
  }
  
  // Start server
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => {
    console.log(`🚀 Server started successfully on port ${PORT}`);
    console.log(`🌐 Application URL: http://localhost:${PORT}`);
    console.log('📱 Ready to accept requests!');
  });
}

// Start the application
startServer().catch(err => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});