var express = require('express');
var router = express.Router();

var department_sub = require('../controllers/DepartmentSubController.js');


router.get('/:id?', department_sub.get);
router.post('/', department_sub.create);
router.put('/:id', department_sub.update);
router.delete('/', department_sub.delete);

module.exports = router;


