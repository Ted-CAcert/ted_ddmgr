const express = require('express');
const cookie = require('cookie');
const router = express.Router();
const UserModel = require("../models/user");

/* Start Login */
router.get('/', function(req, res, next) {
    //ToDo: If valid token can already be found, forward to index

    res.render('login-form', { title: 'Teds D&D Manager' });
});

router.post('/', async function(req, res, next) {
    let TheUser = new UserModel.User(req.body.username);
    let msg;
    let PersonID;
    let Ret;

    await TheUser.load();
    if (TheUser.DataRow && TheUser.DataRow.PersonID) {
        PersonID = TheUser.DataRow.PersonID;
        Ret = await TheUser.checkPassword(req.body.password);
        if (Ret > 0) {
            msg = 'Login OK';
            let TheSession = new UserModel.Session(PersonID);
            await TheSession.WaitForLoad();
            
            res.setHeader('Set-Cookie', cookie.serialize('SessionID', TheSession.SessionID, { maxAge: 60*60*24*7 }));

            res.statusCode = 302;
            res.setHeader('Location', '../');
            res.end();
            return;            
        } else {
            msg = 'Wrong Password';    
        }
    } else {
        msg = 'Username '+req.body.username+' not found!';
    }
 
    res.render('login-info', { title: 'Teds D&D Manager', name: req.body.username, id: PersonID, msg: msg });
});

module.exports = router;
