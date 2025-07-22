const session = require('express-session');

module.exports = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false, // prevent creating empty sessions
  cookie: {
    secure: false,         // true if using HTTPS
    httpOnly: true,        // helps prevent XSS
    sameSite: 'lax',       // or 'none' if cross-site over HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
  }
});