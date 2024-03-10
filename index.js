const express = require('express');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session')
const path = require('path');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
/**
 * This line sets up the Express application to use the express-session middleware for managing sessions.
 * It is configured with a secret key ("fingerprint_customer") and
 * options to enable session resaving and uninitialized session creation.
 * By specifying "/customer", you're indicating that this session middleware should only be active for
 * requests whose paths start with /customer. This means that any routes under the /customer path
 * (e.g., /customer/login, /customer/profile, etc.) will have session management enabled.
 * */
app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

/**
 * This middleware function is used to authenticate requests to routes under the /customer/auth/* path.
 * It intercepts incoming requests and checks for authentication before allowing them to proceed to the next middleware or route handler.
 *
 * Authentication Mechanism:
 * The middleware function checks if there is an accessToken stored in the session under the key authorization.
 * If the token exists, it extracts it.
 * It then uses jsonwebtoken (jwt.verify) to verify the token against the secret key "access".
 * If the token is valid, the decoded user information is attached to the request (req.user) and
 * the middleware calls next() to pass control to the next middleware or route handler.
 * If there's an error during token verification or if the token doesn't exist in the session,
 * the middleware returns a 403 Forbidden status with a JSON response indicating that the customer is not authenticated or logged in.
 *
 * */
app.use("/customer/auth/*", function auth(req,res,next){
//Write the authentication mechanism here
    let token;
    if (req.session.authorization) {
        token = req.session.authorization['accessToken'];
        jwt.verify(token, "access", (err, user) => {
            if (!err) {
                req.user = user;
                next();
            } else {
                return res.status(403).json({message: "customer not authenticated"})
            }
        });
    } else {
        return res.status(403).json({message: "customer not logged in"})
    }
});


app.use("/customer", customer_routes);
app.use("/", genl_routes);
const PORT =5000;

app.listen(PORT,()=>console.log("Server is running"));
module.exports = app