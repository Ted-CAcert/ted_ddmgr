const express = require('express');
const controller = require("../controllers/charController");
const router = express.Router();
const multer = require('multer');

/* GET character listing. */
router.get('/', function(req, res, next) {
  res.render('char_start', {title: 'Characters'});
});

router.post('/', function(req, res, next) {
  res.render('char_create', {title: 'Create Character'});
});

router.post('/save', function(req, res, next) {
  controller.characterSave(req, res, next);
});

const upload = multer();
router.post('/upload', upload.single('xmlfile'), function(req, res, next) {
  controller.characterUpload(req, res, next);
});
module.exports = router;
