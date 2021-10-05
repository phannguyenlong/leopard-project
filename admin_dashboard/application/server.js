/**
 * Server for hosting admin dashboard web application
 * @author Phan Nguyen Long
 */

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const path = require('path');
var app = express();

// config app
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));

const apiRoutes = require("./routes/api.routes")

// routes for API
app.use("/api/", apiRoutes)

// for page
app.use('/', express.static('pages'))

// for 404 page
app.use("*", function (req, res) {
    res.sendFile(path.join(__dirname, '/pages/404.html'));
})

console.log("Server is listnening at port: 8080")
app.listen(8080)