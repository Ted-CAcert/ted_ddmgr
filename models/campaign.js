const DB = require("./db");

exports.getList = async function(PersonID) {
    return DB.getCampaignList(PersonID);
}

exports.save = async function(CampaignData) {
    return DB.saveRecord(CampaignData, "Campaign", "CampaignID", { doLog: true });
}

exports.getById = async function(CampaignID, PersonID) {
  return DB.readRecord(CampaignID, "Campaign", "CampaignID", { restricts: { CreatorID: PersonID }, doLog: true });
}