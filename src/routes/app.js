//* BLOGS APPLICATION
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const cookie = require("cookie-parser");

const app = express();

app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cors());
app.options("*", cors());
app.use(helmet());
app.use(cookie());

const User_Router = require("../routes/user");
const BlogPost_Router = require("../routes/blogPost");
const Admins_Router = require("../routes/admins");
const SuperAdmins_Router = require("../routes/superAdmins");
const comment_Router = require("../routes/comments");

app.use("/api/user/", User_Router);
app.use("/api/blog/", BlogPost_Router);
app.use("/api/admin/", Admins_Router);
app.use("/api/superAdmin/", SuperAdmins_Router);
app.use("/api/comment/", comment_Router);
app.get("/api/home", (req, res) => {
  res.status(200).send("welcome to the home page");
});

module.exports = app;
