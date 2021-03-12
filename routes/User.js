var express = require('express');
var router = express.Router();

var user = require('../controllers/UserController.js');


router.post('/', user.register);
router.get('/', user.get_user);
router.delete('/', user.delete_user);
router.post('/logout', user.logout);
router.post('/login', user.login);
router.get('/ping', user.check_login);
router.get('/activate', user.activate_user);

module.exports = router;


