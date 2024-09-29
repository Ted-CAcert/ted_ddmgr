const DB = require("./db");

exports.find = async function (PersonID) {
    return DB.getCalendarList(PersonID);
}