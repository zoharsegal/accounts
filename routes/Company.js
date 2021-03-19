var express = require('express');
var router = express.Router();

var company = require('../controllers/CompanyController.js');


router.get('/:id?', company.get);
router.post('/', company.create);
router.put('/:id', company.update);
router.delete('/', company.delete);

module.exports = router;


