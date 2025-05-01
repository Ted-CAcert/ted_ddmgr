const DB = require("./db");
const User = require("./user");

exports.HandleEnumList = async function(xmlEnumList) {
    xmlEnumList.forEach(async (xmlEnum) => {
        if (xmlEnum.$) {
          const Type = xmlEnum.$.name;
          if (Type && xmlEnum["dd35:Item"] && xmlEnum["dd35:Item"].forEach) {
            xmlEnum["dd35:Item"].forEach(async (xmlEnumEntry) => {
              const Name = xmlEnumEntry.$.name;
              const Val = xmlEnumEntry.$.value;

              if (Name) {
                let data = await DB.FindEnum(Type, Name);
                // if a record is found data.EnumID is set and saveRecord will do an UPDATE

                data.EnumType = Type;
                data.EnumName = Name;
                data.EnumValue = Val;

                DB.saveRecord(data, "Enums", "EnumID");
              }
            });
          }
        }
    }); 
}

exports.HandleClassesList = async function(classType, classList) {
  console.log("HandleClassesList");
  classList["dd35:Class"].forEach(async (classEntry) => {
    let theClass = {};
    console.log(classEntry.$.name);

    theClass.ClassID = null;
    theClass.ClassName = classEntry.$.name;
    theClass.Book = classEntry.$.book;
    theClass.Page = classEntry.$.page;
    try {
      theClass.ClassDesc = classEntry["dd35:Description"][0];
    } catch(error) {
      theClass.ClassDesc = null;
    }
    theClass.v = classEntry.$.v;
    theClass.BaseAttackBonus = classEntry["dd35:Stats"][0].$.baseAttackBonus;
    theClass.HitDie = classEntry["dd35:Stats"][0].$.hitDie;
    theClass.LevelCount = classEntry["dd35:Stats"][0].$.levelCount;
    try {
      theClass.SpellCaster = classEntry["dd35:Stats"][0]["dd35:Spells"][0].$.type;
    } catch(error) {
      theClass.SpellCaster = null;
    }
    theClass.FortSave = classEntry["dd35:Stats"][0]["dd35:Saves"][0].$.fort;
    theClass.RefSave = classEntry["dd35:Stats"][0]["dd35:Saves"][0].$.ref;
    theClass.WillSave = classEntry["dd35:Stats"][0]["dd35:Saves"][0].$.will;

    theClass.XMLData = JSON.stringify(classEntry);
    DB.insertUpdateClass(theClass);
  });
}

