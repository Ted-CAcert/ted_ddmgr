const express = require('express');
const router = express.Router();
const tree_controller = require("../controllers/treeController");

router.get('/:id', tree_controller.node_get);

router.post('/:id', tree_controller.node_post);


module.exports = router;
