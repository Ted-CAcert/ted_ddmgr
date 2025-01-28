const DB = require("./db");
const User = require("./user");

exports.char = function() {
  this.isPC = null;
  this.XML = null;
  this.Name = null;
  this.GUID = null;
  this.RecID = null;
  
  this.save = async function(PersonID) {
    if (!PersonID) {
        throw({Code: 'NOTALLOWED', Msg: "char.save must be called with PersonID"});
    }
    if (!this.RecID && this.GUID) {
        // Have GUID but no RecID ==> try to find record in database
        this.RecID = await DB.findCharacter(this.GUID, PersonID);
    }

    if (!this.GUID) {
        this.GUID = crypto.randomUUID();
    }

    let TheRec = {};
    if (this.RecID) {
        TheRec.NPCID = this.RecID;
    }
    if (this.XML) {
        TheRec.XMLData = this.XML;
    }
    if (this.Name) {
        TheRec.CharName = this.Name;
    }
    TheRec.CreatorID = PersonID;
    TheRec.CharUID = this.GUID;

    let res = await DB.saveRecord(TheRec, "NPC", "NPCID");

    return res;
  }
}