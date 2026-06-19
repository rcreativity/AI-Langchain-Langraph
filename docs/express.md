Built-in Express Middleware
Middleware	Purpose	Example Use
express.json()	Parse JSON request bodies	REST APIs
express.urlencoded()	Parse HTML form data	Login/Register forms
express.static()	Serve static files	Images, CSS, JS
express.text()	Parse plain text	Webhooks, plain text APIs
express.raw()	Parse raw binary data	Stripe webhooks, file uploads


App Configuration Methods
Method	Purpose
app.use()	Register middleware
app.set()	Set configuration values
app.get()	Read configuration values (when used with one argument)
app.listen()	Start the server
app.engine()	Register a template engine


app.set("view engine", "ejs");
app.set("trust proxy", true);
app.listen(3000);

const router = express.Router();
router.get("/", handler);
router.post("/", handler);
app.use("/users", router);

app.get("/", (req, res) => {
    console.log(req.body);
    console.log(req.params);
    console.log(req.query);
    console.log(req.headers);
    console.log(req.cookies);
});

Common properties:

Property	Description
req.body	Parsed request body
req.params	Route parameters
req.query	Query string parameters
req.headers	HTTP headers
req.ip	Client IP address
req.method	HTTP method
req.path	Request path


res.send();
res.json();
res.status();
res.redirect();
res.download();
res.sendFile();
res.render();
res.cookie();
res.clearCookie();
res.end();
----- eg.
res.status(200).json({
    success: true
});
-----

Common Middleware Stack
===================
A typical Express application starts with something like:

import express from "express";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.listen(3000);

Basic Middleware
===================
import express from "express";

const app = express();

function logger(req, res, next) {
    console.log(`${req.method} ${req.url}`);

    next();
}

app.use(logger);
app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(3000);