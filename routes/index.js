const express = require('express');
const cookie = require('cookie');
const router = express.Router();
const UserModel = require("../models/user");
const campaign_controller = require("../controllers/campaignController");
const basicdata_controller = require("../controllers/basicdataController");

/* GET home page. */
router.get('/', async function(req, res, next) {
  let TheSession = await UserModel.RequestSession(req, res);
  if (TheSession) {
    res.render('index', { title: 'Teds D&D Manager', stringList: TheSession.stringList });
  }

  return;
});

// GET request for creating a Campaign. NOTE This must come before routes that display Campaign (uses id).
router.get("/campaign/create", campaign_controller.campaign_create_get);

// POST request for creating Campaign.
router.post("/campaign/create", campaign_controller.campaign_create_post);
/*
// GET request to delete Campaign.
router.get("/campaign/:id/delete", campaign_controller.campaign_delete_get);

// POST request to delete Campaign.
router.post("/campaign/:id/delete", campaign_controller.campaign_delete_post);

// GET request to update Campaign.
router.get("/campaign/:id/update", campaign_controller.campaign_update_get);

// POST request to update Campaign.
router.post("/campaign/:id/update", campaign_controller.campaign_update_post);
*/
router.get('/campaign/:id/setCampaign', function(req, res, next) {
  let SessionPromise = UserModel.RequestSession(req, res);
  if (SessionPromise) {
    SessionPromise.then((TheSession) => {
      TheSession.setCampaign(req.params.id);
      return campaign_controller.campaign_list(req, res, next);
    });
  }

  return;
});

// GET request for one Campaign.
router.get("/campaign/:id", campaign_controller.campaign_detail);

// GET request for list of all Campaign items.
router.get("/campaigns", campaign_controller.campaign_list);

module.exports = router;
