const createError = require('http-errors');
const express = require('express');
const session = require('express-session')
const MemoryStore = require('memorystore')(session)//store session
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const {verify} = require("jsonwebtoken");
const customer_routes = require('./routes/auth_users').authenticated;
const genl_routes = require('./routes/general.js').general;

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * This line sets up the Express application to use the express-session middleware for managing sessions.
 * It is configured with a secret key ("fingerprint_customer") and
 * options to enable session resaving and uninitialized session creation.
 * By specifying "/customer", you're indicating that this session middleware should only be active for
 * requests whose paths start with /customer. This means that any routes under the /customer path
 * (e.g., /customer/login, /customer/profile, etc.) will have session management enabled.
 * */
app.use("/customer",session({
  cookie: { maxAge: 86400000 },
  secret:"fingerprint_customer",
  resave: true,
  saveUninitialized: true,
  store : new MemoryStore(
      {
        checkPeriod : 86400000 //expiry
      }
  )
}))

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
    verify(token, "access", (err, user) => {
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

// app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/customer", customer_routes);
app.use("/", genl_routes);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
