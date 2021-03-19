var express = require('express');
var router = express.Router();

var account = require('../controllers/AccountController.js');


router.post('/', account.create);
router.put('/', account.update);
router.get('/:id?', account.get);
router.delete('/', account.delete);
router.put('/password', account.update_password);
router.post('/logout', account.logout);
router.post('/login', account.login);
router.get('/login_facebook', account.login_with_facebook);
router.get('/login_gmail', account.login_with_gmail);
router.post('/ping', account.ping);
router.get('/activate', account.activate);
router.post('/password/forgot', account.forgot_password);
router.post('/password/forgot_done', account.forgot_password_done);

module.exports = router;


