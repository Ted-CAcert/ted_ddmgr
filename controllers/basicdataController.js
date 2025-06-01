const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const parseString = require('xml2js').parseString;

const UserModel = require('../models/user');
const BasicdataModel = require('../models/basicdata');

exports.Get = asyncHandler(async (req, res, next) => {
    console.log("Basicdata Get");

    res.render('basicdata_import', {title: 'Basicdata Import' });

});

exports.Upload = asyncHandler(async (req, res, next) => {
    console.log("Basic Data Upload");

    let TheSession = await UserModel.RequestSession(req, res);
    if (TheSession) {

        parseString(req.file.buffer, async (err, xml) => {
            let Msg = [ "No Message" ];

            if (err) {
                throw(err);
            }

            if (xml["dd35:Enums"]) {
                await BasicdataModel.HandleEnumList(xml["dd35:Enums"]["dd35:Enum"]);
                Msg[0] = "Imported as enums";
            } else if (xml["dd35:AllClasses"]) {
                if (xml["dd35:AllClasses"]["dd35:Classes"]) {
                    await BasicdataModel.HandleClassesList("Standard", xml["dd35:AllClasses"]["dd35:Classes"][0]);
                    Msg[0] = "Imported as character classes";
                }
            } else if (xmj("dd35:NPCExport")) {
                
            } else {
                Msg[0] = "Unrecognized file format";
            }

            res.render('basicdata_uploadresult', {title: 'Basic Data Upload Result', Msg: Msg });
        });

    } else {
        throw("Cannot get session!");
    } 
});