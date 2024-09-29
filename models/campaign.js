const DB = require("./db");

exports.getList = async function(PersonID) {
    return DB.getCampaignList(PersonID);
}

exports.save = async function(CampaignData) {
    return DB.saveRecord(CampaignData, "Campaign", "CampaignID", { doLog: true });
}