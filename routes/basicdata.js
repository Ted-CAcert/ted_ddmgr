const express = require('express');
const controller = require("../controllers/basicdataController");
const router = express.Router();
const multer = require('multer');

router.get('/', function(req, res, next) {
    controller.Get(req, res, next);
});
    
const upload = multer();
router.post('/upload', upload.single('xmlfile'), function(req, res, next) {
  controller.Upload(req, res, next);
});

module.exports = router;
