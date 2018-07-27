require('dotenv').config();

const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const Grant = require('grant-express');

const client = require('./server/redis');
const { webRouter, apiRouter } = require('./server/router');

// setup
const app = express();

const grant = new Grant({
  server: {
    protocol: process.env.PROTOCOL,
    host: process.env.HOSTNAME,
    callback: '/callback',
    transport: 'session',
  },
  tumblr: {
    request_url: 'https://www.tumblr.com/oauth/request_token',
    authorize_url: 'https://www.tumblr.com/oauth/authorize',
    access_url: 'https://www.tumblr.com/oauth/access_token',
    oauth: 1,
    key: process.env.TUMBLR_API_KEY,
    secret: process.env.TUMBLR_API_SECRET,
  },
});

app.use(
  session({
    store: new RedisStore({
      client: client,
    }),
    resave: false,
    secure: process.env.PROTOCOL === 'https',
    saveUninitialized: false,
    secret: process.env.SECRET,
  })
);

app.use(grant);

// routes
app.use('/', webRouter);
app.use('/api', apiRouter);

app.use((req, res, next) => {
  if (!req.session) {
    next(new Error('No session'));
  }
  next();
});

app.get('/callback', (req, res) => res.redirect('/'));

app.get('/disconnect', (req, res) => {
  req.session.destroy(err => res.redirect('/'));
});

// listen
app.listen(process.env.PORT, () => {
  console.log(`⌘ listening on port ${process.env.PORT}`);
});