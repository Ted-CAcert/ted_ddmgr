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

    this.initFromRec = function() {
        // SessionID sollte immer schon gesetzt sein.
        this.PersonID = this.theRec.PersonID;
    }

    this.WaitForLoad = async function() { 
        if (this.loadPromise) {
            this.theRec = await this.loadPromise;
            if (this.theRec && this.theRec.PersonID) {
              SessionCache.set(this.SessionID, this.theRec);
              this.initFromRec();
            }
            this.loadPromise = null;
        }
    }

    if (typeof(PersonOrSessionID) == 'bigint' || typeof(PersonOrSessionID) == 'number') {
        // Is an integer ==> PersonID
        this.SessionID = Buffer.from(crypto.randomBytes(30)).toString('base64');
        this.PersonID = PersonOrSessionID;
        this.loadPromise = DB.CreateUserSession(this.PersonID, this.SessionID);
    } else {
        this.SessionID=PersonOrSessionID;
        this.theRec = SessionCache.get(this.SessionID);
        if (!this.theRec) {
            this.loadPromise = DB.LoadUserSession(this.SessionID);
        } else {
            this.initFromRec();
            this.loadPromise = null; // Sollte es eh schon sein...
        }
    }
    
}

exports.User= function (login) {
    this.Login = login;

    this.load = async function() { this.DataRow = await DB.getUserFromDB(login); };
    this.checkPassword = async function(Password) { return await DB.checkUserPassword(this.Login, Password); };
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