const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {router} = require('/login.js');
const router2 = require('/controller');
const cookieParser = require('cookie-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(router2);
app.use(router);
app.listen(process.env.PORT || 3000);











