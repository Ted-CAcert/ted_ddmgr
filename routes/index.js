const express = require('express');
const cookie = require('cookie');
const router = express.Router();
const UserModel = require("../models/user");

/* GET home page. */
router.get('/', async function(req, res, next) {
  let TheSession = UserModel.RequestSession(req, res);
  if (TheSession) {
    res.render('index', { title: 'Teds D&D Manager' });
  }

  return;
});

module.exports = router;
