const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

const NodeModel = require('../models/tree');
const UserModel = require('../models/user');

exports.node_get = asyncHandler(async (req, res, next) => {
    let TheSession = await UserModel.RequestSession(req, res);
    if (TheSession) {
        let TheNode = new NodeModel.Node(req.params.id, TheSession.PersonID);

        await TheNode.WaitForLoad();

        res.render('node', { 
            title: 'Teds D&D Manager', NodeName: TheNode.GetTitle(), 
            Data: TheNode.DataRow[0],
            ChildList: TheNode.Children, Parent: TheNode.Parent[0],
            stringList: TheSession.stringList,
        });
    }
  
    return;  
});

exports.node_post = [ 
    body("child_name")
      .trim()
      .isLength({ min: 1 })
    .escape()
    .withMessage("Child name must not be empty!"),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req);

        let TheSession = await UserModel.RequestSession(req, res);
        if (TheSession) {
            let TheNode = new NodeModel.Node(req.params.id, TheSession.PersonID);

            await TheNode.WaitForLoad();
            await TheNode.CreateChild(req.body.child_name);
            
            TheNode = new NodeModel.Node(req.params.id, TheSession.PersonID);
            await TheNode.WaitForLoad();

            res.render('node', { title: 'Teds D&D Manager', NodeName: TheNode.GetTitle(), 
                Data: TheNode.DataRow[0],
                ChildList: TheNode.Children, Parent: TheNode.Parent[0],
                stringList: TheSession.stringList,
            });
}
    
        return;  
    }),
];