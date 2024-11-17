const DB = require("./db");
const crypto = require('crypto');
const { Buffer } = require('node:buffer');
const KeyVal = require('../tools/keyvalue');
const cookie = require('cookie');

let SessionCache = new KeyVal.KeyValueStore();

function NewSession(PersonOrSessionID) {
    this.PersonID = null;
    this.SessionID = null;
    this.loadPromise = null;
    this.theRec = null;
    this.stringList = {
        PersonName: null,
        CurCampaign: "",
    };

    this.loadStringList = function() {
        let promiseList = [];
        if (this.PersonID && !this.stringList.PersonName) {
            promiseList.push(
                DB.readRecord(this.PersonID, "Person", "PersonID", { fieldList:  [ "PersonLogin", "PersonName" ] })
                  .then((data) => {
                    this.stringList.PersonName = data[0].PersonName ? data[0].PersonName : data[0].PersonLogin;
                  })
            )
        }
        if (this.theRec.CurCampaignID && !this.stringList.CurCampaign) {
            promiseList.push(
                DB.readRecord(this.theRec.CurCampaignID, "Campaign", "CampaignID", { fieldList: "CampaignName" })
                  .then((data) => {
                    this.stringList.CurCampaign = data[0].CampaignName;
            }));
        }
    

        if (promiseList.length) {
            return Promise.all(promiseList);
        } else {
            return Promise.resolve()
        }
    }
    this.initFromRec = function() {
        // SessionID sollte immer schon gesetzt sein.
        this.PersonID = this.theRec.PersonID;
        this.loadPromise = this.loadStringList().then(() => {
            SessionCache.set(this.SessionID, { "Rec": this.theRec, "stringList": this.stringList });
        });
        return this.loadPromise;
    }

    this.WaitForLoad = async function() { 
        if (this.loadPromise) {
            await this.loadPromise;
            this.loadPromise = null;
        }
    }

    this.save = function() {
        return DB.saveRecord(this.theRec, "UserSession", "ID");
    }

    this.setCampaign = function(campaignID) {
        this.theRec.CurCampaignID = campaignID;
        this.stringList.CurCampaign = null;
        this.save();
        // additionally update CurCampaignID of the Person record
        DB.saveRecord({PersonID: this.PersonID, CurCampaignID: campaignID }, "Person", "PersonID", {});
        this.loadStringList();
    }

    if (typeof(PersonOrSessionID) == 'bigint' || typeof(PersonOrSessionID) == 'number') {
        // Is an integer ==> PersonID
        this.SessionID = Buffer.from(crypto.randomBytes(30)).toString('base64');
        this.PersonID = PersonOrSessionID;
        this.loadPromise = DB.CreateUserSession(this.PersonID, this.SessionID)
                             .then((rec) => {
                                this.theRec = rec;
                                return this.initFromRec();
                             });
    } else {
        this.SessionID=PersonOrSessionID;
        let TheCache = SessionCache.get(this.SessionID);
        if (TheCache) {
          this.theRec = TheCache.Rec;
          this.stringList = TheCache.stringList;
        }
        if (!this.theRec) {
            this.loadPromise = DB.LoadUserSession(this.SessionID)
                .then((rec) => {
                    this.theRec = rec;
                    return this.initFromRec();
            });
        } else {
            this.loadPromise = this.initFromRec();
        }
    }
    
}

exports.User= function (login) {
    this.Login = login;

    this.load = async function() { this.DataRow = await DB.getUserFromDB(login); };
    this.checkPassword = async function(Password) { return await DB.checkUserPassword(this.Login, Password); };
    this.setCampaign = async function(campaignID) { return };
}

exports.RequestSession = async function(req, res, next) {
    let cookies;

    if (req.headers.cookie) {
      cookies = cookie.parse(req.headers.cookie || '');
    } else {
      cookies = { SessionID: null }; 
    }
    if (cookies.SessionID) {
      let TheSession = new NewSession(cookies.SessionID);
      await TheSession.WaitForLoad();
  
      if (TheSession.PersonID>0) {
         return TheSession;
      }
    }
  
    res.statusCode = 302;
    res.setHeader('Location', '/login');
    res.end();
    return null;
}

// If a PersonID is specified, a new session is created, if a SessionID is specified the sesion is loaded from the DB
exports.Session=NewSession;