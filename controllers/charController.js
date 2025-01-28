const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const parseString = require('xml2js').parseString;
const UserModel = require('../models/user');
const CharModel = require('../models/chars');

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

    let TheSession = await UserModel.RequestSession(req, res);
    if (TheSession) {

        parseString(req.file.buffer, (err, xml) => {
            let Msg;

            if (err) {
                throw(err);
            }
            let TheList = extractCharlist(xml);

            if (!TheList) {
                Msg = "No characters found in the file.";
            } 
            res.render('char_importlist', {title: 'Select characters to import', CharList: TheList, Msg: Msg });

            TheSession.SessionStatus.CharImport = TheList;
            TheSession.Modified();
        });

    } else {
        throw("Cannot get session!");
    } 
});

function extractCharlist(XMLData) {
    let CharList = [];

    if (XMLData["dd35:NPCExport"] && XMLData["dd35:NPCExport"]["dd35:NPCs"][0]["dd35:NPC"]) {
        XMLData["dd35:NPCExport"]["dd35:NPCs"][0]["dd35:NPC"].forEach((npc) => {
            CharList.push({Name: npc.$.name, Type: "(NPC)", XML: npc });
        });
    }

    if (XMLData["dd35:PCExport"] && XMLData["dd35:PCExport"]["dd35:PCs"][0]["dd35:PC"]) {
        XMLData["dd35:PCExport"]["dd35:PCs"][0]["dd35:PC"].forEach((npc) => {
            CharList.push({Name: npc.$.name, Type: "(PC)", XML: npc });
        });
    }

    return CharList;
}

exports.characterImport = [
    asyncHandler(async (req, res, next) => {
        console.log("charImport");

        let TheSession = await UserModel.RequestSession(req, res);
        if (TheSession) {
            let Msg = Array();
            if (!TheSession.SessionStatus.CharImport) {
                throw("No CharImport in SessionStatus!");
            }
            if (req.body.CharIdx) {
                for(const idx of req.body.CharIdx) {
                    if (idx >= TheSession.SessionStatus.CharImport.length) {
                        throw("Invalid index in request data");
                    }
                    Msg.push(await DoImport(TheSession.SessionStatus.CharImport[idx], TheSession.PersonID));
                }
            } else {
                Msg.push("No characters selected for import.");
            }
            

            res.render('char_importresult', {title: 'Import Result', MsgList: Msg });

        } else {
            throw("Cannot get session!");
        } 
    }) 
];

// npc kann auch ein PC sein!
async function DoImport(npc, PersonID) {
    let Msg;
    let theChar = new CharModel.char;

    if (npc.XML.$.playerName) {
        theChar.isPC = true;
    } else {
        theChar.isPC = false;
    }

    const re = RegExp("UID\\(([^\\)]+)\\)", "i");
    let resarray = re.exec(npc.XML["dd35:Stats"][0]["dd35:Description"][0]);
    if (resarray && resarray.length > 1) {
        theChar.GUID = resarray[1];
    }
    theChar.Name = npc.XML.$.name;

    Msg = theChar.Name + ", ";
    if (resarray) {
        Msg += `UID: ${theChar.GUID}, `;
    } else {
        Msg += "no UID found, ";
    }
    theChar.XML = npc.XML;

    await theChar.save(PersonID);
    return Msg;
}