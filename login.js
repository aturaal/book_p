const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const database = require('./database');
const env = require('dotenv');
env.config();
const SECRET = process.env.JWT;
const SECRET2 = process.env.JWT2;

// Middleware to verify user token
const verifyjwt = function(req, res, next) {
  const token = req.headers.cookie ? req.headers.cookie.split("=")[1] : null;

  if (!token) {
     res.status(401).json({ error: "Unauthorized User!" });
  }

  try {
    jwt.verify(token, SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized User!" });
  }
};

const verifySuperadminJWT = function(req, res, next) {
  const token = req.headers.cookie ? req.headers.cookie.split("=")[1] : null;

  if (!token) {
     res.status(401).json({ error: "Unauthorized User!" });
  }

  try {
    jwt.verify(token, SECRET2);
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized User!" });
  }
};

const verifyEitherJWT = function(req, res, next) {
  const token = req.headers.cookie ? req.headers.cookie.split("=")[1] : null;

  if (!token) {
     res.status(401).json({ error: "Unauthorized User!" });
  }

  try {
    jwt.verify(token, SECRET);
    next();
  } catch (error) {
    try {
      jwt.verify(token, SECRET2);
      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized User!" });
    }
  }
}; 

router.post("/register", async (req, res, next) => {
   try {
     const hashedPassword = await bcrypt.hash(req.body.password, 10);
     const mail = req.body.mail
     const alreadyreg = await database("admins1")
     .where({mail : mail})
     .select("mail")
     .first()
     if(alreadyreg) {
       return res.status(401).send('User already registered!');
     }
     await database("admins1").insert({
       mail: req.body.mail,
       password: hashedPassword,
       role: req.body.role
     });
     res.json("Successfully Registered!");
   } catch (error) {
     next(error);
   }
 });

 
 router.get("/login", (req, res) => {
   res.sendFile("login.html", { root: __dirname });
 });
 
 router.post("/login", async (req, res, next) => {
   try {
     const mail = req.body.mail;
     const password = req.body.password;
 
     const user = await database("admins1")
       .where({ mail: mail })
       .first();
     if (!user) return res.status(401).json({ error: "Wrong credentials" });
 
     const isPasswordMatch = await bcrypt.compare(password, user.password);
     if (!isPasswordMatch) return res.status(401).json({ error: "Unauthorized User!" });
 
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
 