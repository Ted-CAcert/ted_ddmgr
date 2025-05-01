const mariadb = require('mariadb');
const Config = require('../config');

const InitPool = mariadb.createPool({
    host: Config.cfg.DB.host,
    user: Config.cfg.DB.user,
    password: Config.cfg.DB.password,
    database: Config.cfg.DB.database,
    connectionLimit: 10
});

function debugLine(message) {
  let e = new Error();
  let frame = e.stack.split("\n")[2]; // change to 3 for grandparent func
  let lineNumber = frame.split(":").reverse()[1];
  let functionName = frame.split(" ")[5];
  return functionName + ":" + lineNumber + " " + message;
}


exports.getUserFromDB=async function(UserLogin) {
  let conn;

  try {
	conn = await InitPool.getConnection();
	const rows = await conn.query("SELECT PersonID, PrimaryOrgID, CreatedTS, Deleted, PasswordHash FROM Person WHERE PersonLogin=?", UserLogin);
	
    if (!rows || rows.length < 1) {
        console.log("User "+UserLogin+" not found");
        return null;
    }
    return rows[0];


  } finally {
	  if (conn) conn.release(); //release to pool
  }
}

exports.checkUserPassword=async function(UserLogin, Password) {
    let conn;

    try {
      conn = await InitPool.getConnection();
      const rows = await conn.query("SELECT FCT_CheckPassword(?, ?) Res", [ UserLogin, Password ]);
      
      if (!rows || rows.length < 1) {
          console.log("User "+UserLogin+" not found");
          return null;
      }
      return rows[0].Res;
  
    } finally {
        if (conn) conn.release(); //release to pool
    }
}

exports.createUserRecord=async function(UserLogin, UserDetails) {
  let conn;
  let res;

  try {
    conn = await InitPool.getConnection();
    let query = "INSERT INTO Person(PersonLogin";
    let params = [ UserLogin ];

    if (UserDetails && UserDetails.PersonName) {
      query += ", PersonName";
      params.push(UserDetails.PersonName);
    }
    // More Details to follow...

    query += ', CreatedTS) VALUES(';
    params.forEach(function() { query += '?, '});
    query += 'UTC_TIMESTAMP())'

    res = await conn.query(query, params);
    console.log("Insert result");
    console.log(res);
  } catch(error) {
    console.log("error in createUserRecord");
    console.log(debugLine(error));
    throw error;
  } finally {
	  if (conn) conn.release();
  }
  return res;
}

exports.saveRegChallenge=async function(PersonID, TheChallenge) {
  let conn;
  let res;

  try {
    conn = await InitPool.getConnection();
    let query = "UPDATE Person SET CurChallenge = ?, CurChallengeTS = UTC_TIMESTAMP() WHERE PersonID = ?";
    let params = [ TheChallenge, PersonID ];

    res = await conn.query(query, params);
    console.log("Updated Challenge in Person");
    console.log(res);
  } catch(error) {
    console.log("error in saveRegChallenge");
    console.log(debugLine(error));
    throw error;
  } finally {
	  if (conn) conn.release();
  }
  return res;
}

exports.readRegChallenge=async function(PersonID) {
  let conn;
  let res;

  try {
    conn = await InitPool.getConnection();
    let query = "SELECT CurChallenge FROM Person WHERE PersonID=?";
    let params = [ PersonID ];

    const rows = await conn.query(query, params);
    console.log("read Challenge result: "+JSON.stringify(rows));
    if (!rows || rows.length < 1) {
      console.log("No challenge for "+PersonID+" not found");
      return null;
    }
    return rows[0].CurChallenge;
  } catch(error) {
    console.log("error in readRegChallenge");
    console.log(debugLine(error));
    throw error;
  } finally {
	  if (conn) conn.release();
  }
  return res;
}

exports.saveAuthenticator=async function(PersonID, Authenticator) {
  let conn;
  let res;

  try {
    if (!Authenticator.credentialID) { Authenticator.credentialID = null; }
    if (!Authenticator.credentialPubKey) { Authenticator.credentialPubKey = null; }
    if (!Authenticator.counter) { Authenticator.counter = null; }
    if (!Authenticator.credentialDeviceType) { Authenticator.credentialDeviceType = null; }
    if (!Authenticator.credentialBackedUp) { Authenticator.credentialBackedUp = null; }
    if (!Authenticator.transports) { Authenticator.transports = null; }
    if (!Authenticator.authType) { Authenticator.authType = null; }

    conn = await InitPool.getConnection();
    if (Authenticator.AuthenticatorID) {
      let query = "UPDATE Authenticator SET credentialID=?, credentialPubKey=?, counter=?, credentialDeviceType=?, "+
                  "       credentialBackedUp=?, transports=?, authType=? WHERE AuthenticatorID=?";
      let params = [ 
        btoa(Authenticator.credentialID), 
        Authenticator.credentialPubKey,
        Authenticator.counter,
        Authenticator.credentialDeviceType,
        Authenticator.credentialBackedUp,
        AuthenAuthenticator.transports,
        Authenticator.authType,
        Authenticator.AuthenticatorID
      ];
    } else {
      let query = "INSERT INTO Authenticator (PersonID, credentialID, credentialPubKey, counter, credentialDeviceType, "+
                  "       credentialBackedUp, transports, authType) VALUES(?, ?, ?, ?, ?, ?, ?, ?)";
      let params = [ 
        PersonID,
        btoa(Authenticator.credentialID), 
        Authenticator.credentialPubKey,
        Authenticator.counter,
        Authenticator.credentialDeviceType,
        Authenticator.credentialBackedUp,
        AuthenAuthenticator.transports,
        Authenticator.authType
      ];
    }
    res = await conn.query(query, params); 
    console.log("saveAuthenticator result: "+ res.toString());
  } catch(error) {
    console.log("error in saveAuthenticator");
    console.log(debugLine(error));
    throw error;
  } finally {
	  if (conn) conn.release();
  }
}

exports.CreateUserSession = async function(PersonID, SessionID) {
  let conn;
  let thePromise;
  let res;

  try {
    thePromise = InitPool.getConnection();

    conn = await thePromise;
    let query = 'INSERT INTO UserSession(ID, PersonID, CreateTS) VALUES(?, ?, NOW())';
    await conn.query(query, [SessionID, PersonID]);

    query = 'SELECT * FROM UserSession WHERE ID=?';
    res = await conn.query(query, [ SessionID ]);
    return res[0];

  } catch(error) {
    console.log("error in CreateUserSession");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

exports.LoadUserSession = async function(SessionID) {
  let conn;
  let thePromise;
  let res;

  try {
    thePromise = InitPool.getConnection();

    conn = await thePromise;
    let query = 'SELECT * FROM UserSession WHERE ID=?';
    res = await conn.query(query, [ SessionID ]);
    query = 'UPDATE UserSession SET LastUsedTS = NOW() WHERE ID=?';
    conn.query(query, [ SessionID ]);
    return res[0];

  } catch(error) {
    console.log("error in LoadUserSession");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

exports.CreateNode = async function(NodeText, ParentNodeID, PersonID) {
  let conn;
  let thePromise;
  let res;

  try {
    thePromise = InitPool.getConnection();

    conn = await thePromise;
    let query = 'INSERT INTO NodeTree(NodeText, ParentNodeID, PersonID) VALUES(?, ?, ?)';
    await conn.query(query, [ NodeText, ParentNodeID, PersonID ]);
  } catch(error) {
    console.log("error in CreateNode");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }
}

exports.GetChildNodes = async function(ParentNodeID, PersonID) {
  let conn;
  let res;

  try {
    conn = await InitPool.getConnection();
    let query;
    if (ParentNodeID > 0) {
      query = 'SELECT * FROM NodeTree WHERE ParentNodeID=? AND PersonID=?';
      res = await conn.query(query, [ ParentNodeID, PersonID ]);
    } else {
      query = 'SELECT * FROM NodeTree WHERE ParentNodeID IS NULL AND PersonID=?';
      res = await conn.query(query, [ PersonID ]);
    }
  } catch(error) {
    console.log("error in GetChildNodes");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }

  return res;
}

exports.getNodeFromDB = async function(NodeID, PersonID) {
  let conn;
  let thePromise;
  let res;

  try {
    thePromise = InitPool.getConnection();

    conn = await thePromise;
    let query;
    query = 'SELECT * FROM NodeTree WHERE NodeTreeID=? AND PersonID=?';
    res = await conn.query(query, [ NodeID, PersonID ]);
  } catch(error) {
    console.log("error in GetNodeFromDB");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }

  return res;
}

exports.getNodeChildren = async function(NodeID, PersonID) {
  let conn;
  let res;

  try {
    conn = await InitPool.getConnection();

    let query;
    if (NodeID > 0) {
      query = 'SELECT * FROM NodeTree WHERE ParentNodeID=?';
      res = await conn.query(query, [NodeID]);
    } else {
      query = 'SELECT * FROM NodeTree WHERE ParentNodeID IS NULL AND PersonID=?';
      res = await conn.query(query, [PersonID]);
    }
  } catch(error) {
    console.log("error in getNodeChildren");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }

  return res;  
}

exports.createNode = async function(ParentNodeID, NodeName, PersonID) {
  let conn;
  let thePromise;
  let res;

  try {
    conn = await InitPool.getConnection();

    let query;
    if (ParentNodeID > 0) {
      // Inherits PersonID from ParentNode
      query = 'INSERT INTO NodeTree(ParentNodeID, NodeName, PersonID) ' +
               ' SELECT NodeTreeID, ?, PersonID FROM NodeTree WHERE NodeTreeID=?';
      res = await conn.query(query, [NodeName, ParentNodeID]);
    } else {
      query = 'INSERT INTO NodeTree(NodeName, PersonID) VALUES(?, ?)';
      res = await conn.query(query, [NodeName, PersonID]);
    }
  } catch(error) {
    console.log("error in createNode");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }

  return res;
}

exports.getParentList = async function(NodeID, PersonID) {
  let conn;
  let res;

  try {
    conn = await InitPool.getConnection();

    let query = 
      "SELECT P1.NodeTreeID ID1, P1.NodeName Name1, P2.NodeTreeID ID2, P2.NodeName Name2, P3.NodeTreeID ID3, P3.NodeName Name3, "+
      "       P4.NodeTreeID ID4, P4.NodeName Name4, P5.NodeTreeID ID5, P5.NodeName Name5,"+
      "       P5.ParentNodeID More"+
      "  FROM NodeTree P0 "+
      "       LEFT OUTER JOIN NodeTree P1 ON (P0.ParentNodeID=P1.NodeTreeID) "+
      "       LEFT OUTER JOIN NodeTree P2 ON (P1.ParentNodeID=P2.NodeTreeID)"+ 
      "       LEFT OUTER JOIN NodeTree P3 ON (P2.ParentNodeID=P3.NodeTreeID)"+
      "       LEFT OUTER JOIN NodeTree P4 ON (P3.ParentNodeID=P4.NodeTreeID)"+
      "       LEFT OUTER JOIN NodeTree P5 ON (P4.ParentNodeID=P5.NodeTreeID)"+
      " WHERE P0.NodeTreeID=? AND P0.PersonID=?";

    res = await conn.query(query, [NodeID, PersonID]);
  } catch(error) {
    console.log("error in getParentList");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }

  return res;
}

exports.getCalendarList = async function(PersonID) {
  let conn;
  let res;
  let query;
  try {
    conn = await InitPool.getConnection();

    // Hmm... are Calendars global? For the moment we'll assume so.
    let query = "SELECT * FROM Calendar";

    res = await conn.query(query);
  } catch(error) {
    console.log("error in getCalendarList");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }

  return res;
}

exports.getCampaignList = async function(PersonID) {
  let conn;
  let res;
  let query;
  try {
    conn = await InitPool.getConnection();

    let query = "SELECT * FROM Campaign WHERE CreatorID=?";

    res = await conn.query(query, [ PersonID ]);
  } catch(error) {
    console.log("error in getCampaignList");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }

  return res;
}

exports.findCharacter = async function(uuid, PersonID) {
  let conn;
  let res;
  let query;
  try {
    conn = await InitPool.getConnection();

    let query = "SELECT NPCID FROM NPC WHERE CharUID=? AND CreatorID=?";

    let DBres = await conn.query(query, [ uuid, PersonID ]);
    if (DBres.length > 0) {
      res = DBRes[0];
    } else {
      res = null;
    }
  } catch(error) {
    console.log("error in findCharacter");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }

  return res;
}

exports.insertUpdateClass = async function (aClass) {

  let conn;
  let res;
  let query;
  let dataArray = [];

  try {
    conn = await InitPool.getConnection();

    if (!aClass.ClassID) {
      query = "SELECT ClassID FROM Classes WHERE ClassName = ? and Book = ?";
      res = await conn.query(query, [ aClass.ClassName, aClass.Book ]);
      if (res && res[0]) {
        aClass.ClassID =res[0].ClassID;
      }

      res = exports.saveRecord(aClass, 'Classes', 'ClassID');
    }

  } catch(error) {
    console.log("error in saveRecord");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }

  return res;
}

/* Saves record data into a database table.
  If the primary key value is null, a new record is inserted, otherwise update is used.

  options: 
    - doLog, if true, resulting query is logged
*/
exports.saveRecord = async function(recordData, tableName, primaryKey, options) {

  let conn;
  let res;
  let query;
  let dataArray = [];

  try {
    conn = await InitPool.getConnection();

    if (recordData[primaryKey]) {
      let firstLine = true;

      query = "UPDATE "+tableName+" SET ";

      for(const property in recordData) {
        if (property == primaryKey) { continue; }

        if (firstLine) {
          firstLine = false;
        } else {
          query += ", "
        }
        query += property + "=?";
        dataArray.push(recordData[property]);
      }
      query += " WHERE "+primaryKey+"=?";      
      dataArray.push(recordData[primaryKey]);
    } else {
      let valueList = "";
      let firstLoop = true;
      query = "INSERT INTO "+tableName+"("
      for(const property in recordData) {
        if (firstLoop) { firstLoop = false; }
        else { 
          query += ", ";
          valueList += ", ";
        };
        query += property;
        valueList += "?";
        dataArray.push(recordData[property]);
      }
      query += ") VALUES ("+valueList+")";
    }
    if (options && options.doLog) {
      console.log(query);
    }
    res = await conn.query(query, dataArray);
  } catch(error) {
    console.log("error in saveRecord");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }

  return res;
}

/*
  options:
    - doLog, if true, resulting query is logged
    - fieldList, string or array of strings
*/
exports.readRecord = async function(recID, tableName, primaryKey, options) {
  let conn;
  let res;
  let query;
  let dataArray = [];

  try {
    conn = await InitPool.getConnection();

    query = "SELECT ";
    if (options && options.fieldList) {
      if (options.fieldList.forEach) {
        let firstLoop = true;
        options.fieldList.forEach((elm) => {
          if (firstLoop) {firstLoop = false; }
          else {
            query += ", "
          }
          query += elm;
        });
        query += " ";
      } else {
        query += options.fieldList+" ";
      }     
    } else {
      query += "* ";
    }
    query += "FROM "+tableName+" WHERE "+primaryKey+"=?";
    dataArray.push(recID);

    if (options.restricts) {
      for(const key of Object.keys(options.restricts)) {
        query += " AND "+key+"=?";
        dataArray.push(options.restricts[key]);
      }
    }
 
    if (options && options.doLog) {
      console.log(query);
    }
    res = await conn.query(query, dataArray);
  } catch(error) {
    console.log("error in readRecord");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }
  return res;
}

exports.FindEnum = async function(EnumType, EnumName) {
  let conn;
  let res;
  let query;
  let dataArray = [ EnumType, EnumName ];

  try {
    conn = await InitPool.getConnection();

    query = "SELECT EnumID FROM Enums WHERE EnumType=? AND EnumName=?";
    res = await conn.query(query, dataArray);
  } catch(error) {
    console.log("error in FindEnum");
    console.log(debugLine(error));
    throw error;
  } finally {
    if (conn) conn.release();
  }
  return res;
}