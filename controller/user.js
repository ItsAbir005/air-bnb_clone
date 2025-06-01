const User = require("../models/user");

module.exports.rendersignUpForm = (req, res) => {
    return res.render("user/signup.ejs");
};

module.exports.signUpUser = async (req, res, next) => { // Removed duplicate, kept this one
    try {
        let { username, email, password } = req.body;

        // Check if username or email already exists (case-insensitive for username, exact for email generally)
        // Note: Using RegExp for case-insensitive check on username. Email is usually case-sensitive for uniqueness.
        let existingUser = await User.findOne({ $or: [{ username: new RegExp(`^${username}$`, "i") }, { email: email }] });

        if (existingUser) {
            // If user exists, log them in
            req.login(existingUser, function (err) {
                if (err) {
                    return next(err);
                }
                req.flash("success", "Welcome back to Wanderlust"); // Flash message for existing user login
                return res.redirect("/listings"); // Redirect to listings page
            });
        } else {
            // If user doesn't exist, create a new one
            let newUser = new User({
                username,
                email,
            });

            // Register the new user
            let registeredUser = await User.register(newUser, password); // Store the result of register

            // Log the new user in after registration
            req.login(registeredUser, function (err) { // Use registeredUser here
                if (err) {
                    return next(err);
                }
                req.flash("success", "Welcome to Wanderlust"); // Flash message for new user signup
                return res.redirect("/listings"); // Redirect to listings page
            });
        }
    } catch (e) {
        req.flash("error", e.message);
        return res.redirect("/signup"); // Redirect to signup page if an error occurs
    }
};

module.exports.renderloginForm = (req, res) => {
    return res.render("user/login.ejs");
};

module.exports.login = (req, res) => {
    req.flash("success", "Welcome back to Wanderlust");
    const redirectUrl = res.locals.redirectUrl || "/listings"; // Use const for redirectUrl
    return res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logged out Successfully!"); // Changed message for clarity
        return res.redirect("/listings");
    });
};
