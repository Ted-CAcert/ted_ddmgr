const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");


exports.characterSave = asyncHandler(async (req, res, next) => {
    console.log("charSave");
    res.render('char_create', {title: 'Create Character'});
    
    /*    res.render("campaign_list", {
        title: "Available Campaigns",
        campaign_list: campaignList, 
        stringList: TheSession.stringList,
      });*/
});

exports.characterUpload = asyncHandler(async (req, res, next) => {
    console.log("charUpload");
    res.render('char_start', {title: 'Characters'});
    
    /*    res.render("campaign_list", {
        title: "Available Campaigns",
        campaign_list: campaignList, 
        stringList: TheSession.stringList,
      });*/
});