'use strict';

var config = require('config');
var express = require('express');
var app = express();
var path = require('path');
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync(__dirname+'/key.pem'),
  cert: fs.readFileSync(__dirname+'/cert.pem')
};
// Add the route for handling tabs
var tabs = require('./server/tabs');
tabs.setup(app);

app.use(express.static(path.join(__dirname, 'client')));
  app.set('view engine', 'pug');
  app.set('views', path.join(__dirname, 'client/views'));

// Decide which port to use
var port = process.env.PORT ||
           config.has("port") ? config.get("port") : 3333;

// Listen for incoming requests
app.listen(port, function() {
    console.log(`App started listening on port ${port}`);
});
https.createServer(options, app).listen(443);