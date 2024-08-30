const DB = require("./db");
const User = require("./user");

exports.Node = function(NodeID, PersonID) {
    this.PersonID = PersonID;
    this.DataRow = [];
    this.loadPromise = null;
    this.Children = [];
    this.Parent = [];

    this.load = async function() {
        let prmParent;
        let prmChildren;

        if (NodeID > 0) {
            this.DataRow = await DB.getNodeFromDB(NodeID, PersonID);
        } else {
            this.DataRow = [{ NodeTreeID: 0, ParentNodeID: null, NodeName: 'Root', PersonID: PersonID }];
        }

        if (this.DataRow[0].ParentNodeID > 0) {
            prmParent = DB.getParentList(this.DataRow[0].NodeTreeID, PersonID);
        } else {
            this.Parent = [{ ID1: null, Name1: null, ID2: null, Name2: null, ID3:null, Name3: null,
                             ID4: null, Name4: null, ID5: null, Name5: null,
                             More: null
             }];
        }
        prmChildren = DB.GetChildNodes(NodeID, PersonID);

        if (prmParent) {
            this.Parent = await prmParent;
        }
        this.Children = await prmChildren;
    }

    this.GetTitle = function() {
        if (this.DataRow[0].NodeName) {
            return this.DataRow[0].NodeName;
        } else {
            return '?';
        }
    }

    this.WaitForLoad = async function() { 
        if (this.loadPromise) {
            await this.loadPromise;
            this.loadPromise = null;
        }
    }

    this.CreateChild = async function(NodeName) {
      return await DB.createNode(this.DataRow[0].NodeTreeID, NodeName, PersonID);
    } 

    this.loadPromise = this.load();
}