var express = require('express');
var router = express.Router();

var organization = require('../controllers/OrganizationController.js');


router.get('/:id?', organization.get);
router.post('/', organization.create);
router.put('/:id', organization.update);
router.delete('/', organization.delete);

module.exports = router;


