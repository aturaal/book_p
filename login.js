const knex = require('knex');
const router = require('express').Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const database = require('../database');
const env = require('dotenv');
const { json } = require('body-parser');
env.config();
const SECRET = process.env.JWT;
const SECRET2 = process.env.JWT2;

// Middleware to verify user token
const verifyjwt = function(req, res, next) {
   const token = req.cookies.token


  if (!token) {
     res
     .status(401).json({ error: "Unauthorized User!" });
  }

  try {
    jwt.verify(token, SECRET);
    next();
  } catch (error) {
    res
    .status(401).json({ error: "Unauthorized User!" });
  }
};

const verifySuperadminJWT = function(req, res, next) {
   const token = req.cookies.admintoken


  if (!token) {
     res
     .status(401).json({ error: "Unauthorized User!" });
  }

  try {
    jwt.verify(token, SECRET2);
    next();
  } catch (error) {
    res
    .status(401).json({ error: "Unauthorized User!" });
  }
};

const verifyEitherJWT = function(req, res, next) {
   console.log(req.cookies)
   const token = req.cookies.token || req.cookies.admintoken
  if (!token) {
     res
     .status(401).json({ error: "Unauthorized User!" });
  }

  try {
    jwt.verify(token, SECRET);
    next();
  } catch (error) {
    res
    .status(403)
    .send('Forbidden Request 401')
    }
  }


router.post("/register", async (req, res, next) => {
   try {
     const hashedPassword = await bcrypt.hash(req.body.password, 10);
     await database("admins1").insert({
       mail: req.body.mail,
       password: hashedPassword,
       role: req.body.role
     });
     res
     .json("Successfully Registered!");
   } catch (error) {
     next(error);
   }
 });
 
 router.get("/login", (req, res) => {
   res
   .sendFile("login.html", { root: __dirname });
 });
 
 router.post("/login", async (req, res, next) => {
   try {
     const mail = await database("admins1").where({ mail: req.body.mail }).first();
     if (!mail)  res.status(401).json({ error: "Wrong credentials" });
 
     const isAuthenticated = await bcrypt.compare(req.body.password, mail.password);
     if (!isAuthenticated)  res.status(401).json({ error: "Unauthorized User!" });
 
     const user = mail;
     const secret = user.role === "superadmin" ? SECRET2 : SECRET;
     const token = await jwt.sign(user, secret, { expiresIn: "7d" });
 
     res
       .cookie("token", token, { httpOnly: true, sameSite: "strict" })
       .status(200)
       .json({ token });
   } catch (error) {
     next(error);
   }
 });

 module.exports = { router, verifyjwt, verifySuperadminJWT, verifyEitherJWT };
 