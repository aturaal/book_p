const express = require('express');
const app = express();
const { json } = require('express');
const { emitWarning, nextTick } = require('node:process');
const knex = require('knex');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const { createSecretKey } = require('node:crypto');
const { JsonWebTokenError } = require('jsonwebtoken');
const jwt = require('jsonwebtoken');
const {verifyjwt , router} = require('./admin-panel/login.js');
const controller = require('./controller')
const cookieParser = require('cookie-parser')
const cors = require('cors');

router.use(cookieParser())
app.use(controller)

app.use(cors());
app.use(bodyParser.json());


app.use(router)
app.use(bodyParser.urlencoded({ extended: false }));

const server = require('node:http').createServer(app);






app.listen(3000 || process.env.PORT)
