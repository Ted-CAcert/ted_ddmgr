const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

const Campaign = require('../models/campaign');
const Calendar = require('../models/calendar');
const UserModel = require('../models/user');

exports.campaign_list = asyncHandler(async (req, res, next) => {
    let TheSession = await UserModel.RequestSession(req, res);
    if (! TheSession) return;

    let campaignList = await Campaign.getList(TheSession.PersonID);
  
    res.render("campaign_list", {
        title: "Available Campaigns",
        campaign_list: campaignList,
      });
});

exports.campaign_create_get = asyncHandler(async (req, res, next) => {
    let TheSession = await UserModel.RequestSession(req, res);
    if (! TheSession) return;

    const allCalendars  = await Calendar.find(TheSession.PersonID);
    allCalendars.sort((a, b) => { 
        if (a.CalendarName.toUpperCase() < b.CalendarName.toUpperCase()) {
            return -1;
        } else if (a.CalendarName.toUpperCase() > b.CalendarName.toUpperCase()) {
            return 1;
        }
        return 0;
    });
      
    res.render("campaign_form", {
      title: "Create Campaign",
      calendars: allCalendars,
    });
  });

exports.campaign_create_post = [
    (req, res, next) => {
        // Do nothing for the moment
        next();
    },
    // Validate and sanitize fields.
    body("title", "Title must not be empty.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    body("epoch_year", "Please specify a starting year.")
      .trim()
      .isLength({ min: 1 })
      .escape(),
    
    // Process request after validation and sanitization.

    asyncHandler(async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        let TheSession = await UserModel.RequestSession(req, res);
        if (! TheSession) return;
                
        // Create a Campaign object with escaped and trimmed data.
        const CampaignData = {
            CampaignName: req.body.title,
            CalendarID: req.body.calendar,
            EpochYear: req.body.epoch_year,
            EpochDOY: req.body.epoch_doy,
            RoundOffset: req.body.rounds,
            CreatorID: TheSession.PersonID,
        };
        
    
        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
    
            // Get all calendars for form.
            const allCalendars  = await Calendar.find(TheSession.PersonID);
            allCalendars.sort((a, b) => { 
                if (a.CalendarName.toUpperCase() < b.CalendarName.toUpperCase()) {
                    return -1;
                } else if (a.CalendarName.toUpperCase() > b.CalendarName.toUpperCase()) {
                    return 1;
                }
                return 0;
            });
            
            // Mark our selected calendar as checked.
            for (const calendar of allCalendars) {
                if (CampaignData.CalendarID.includes(calendar.CalendarID)) {
                    calendar.checked = "true";
                }
            }
            res.render("campaign_form", {
            title: "Create Campaign",
            calendars: allCalendars,
            campaign: CampaignData,
            errors: errors.array(),
            });
        } else {
            // Data from form is valid. Save book.
            await Campaign.save(CampaignData);
            res.redirect('/campaigns');
        }
    }),
]