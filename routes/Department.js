var express = require('express');
var router = express.Router();

var department = require('../controllers/DepartmentController.js');


router.get('/:id?', department.get);
router.post('/', department.create);
router.put('/:id', department.update);
router.delete('/', department.delete);

module.exports = router;


