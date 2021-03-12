const appConfig = require("../environment/app.config");
const appTemplates = require("../environment/app.templates");
const appErrorsConfig = require("../environment/app.errors");
const db = require("../models");
const account = db.accounts;
const session = db.sessions;
const Op = db.Sequelize.Op;
const crypto = require("crypto");
const moment = require('moment')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    host: appConfig.smtpHost,
    port: appConfig.smtpPort,
    secure: appConfig.smtpIsSSL, // true for 465, false for other ports
    auth: {
        user: appConfig.smtpUserName, // generated ethereal user
        pass: appConfig.smtpPassword  // generated ethereal password
    }
});

/**
 * CREATE new user
 *
 */

exports.register = (req, res) => {
    if (req.cookies.sessionToken) {
        return appErrorsConfig.getErrorByLang("user","AlreadyLoggedIn",req.body.langId || user.langId,res)
    } else {
        var passGen = crypto.randomBytes(20).toString('hex');
        var activationHash = bcrypt.hashSync(passGen, bcrypt.genSaltSync(10), null);
        const user = {
            userName: req.body.userName,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: req.body.password,
            password_confirmation: req.body.password_confirmation,
            email: req.body.email,
            langId: req.body.langId,
            activateHash: activationHash,
            lastIp: appConfig.getClientIp(req)
        };

        var passGen = crypto.randomBytes(20).toString('hex');
        var hashSessionId = bcrypt.hashSync(passGen, bcrypt.genSaltSync(10), null);
        account.create(user)
            .then(dataUser => {
                return dataUser
            })
            .then(dataUser => {
                const sessiodData = {
                    userId: dataUser.id,
                    userName: dataUser.userName,
                    lastIp: dataUser.lastIp,
                    sessionId: hashSessionId,
                };
                var jsonRes={
                    data:{
                        id:dataUser.id,
                        type: "account",
                        attributes: {
                            "userName": dataUser.userName,
                            "firstName": dataUser.firstName,
                            "lastName": dataUser.lastName,
                            "sessionToken": null,
                        }
                    }
                }
                //check if activation needed for origin app
                if (!appConfig.appHostsActivationCheck(req.get('origin'),false)) {
                    let originAppDetails=appConfig.appNameByOrigin(req.get('origin'))
                    console.log(originAppDetails)
                    var mailOptions = {
                        from: 'no-replay <no-replay@' + originAppDetails.appName + '>',
                        to: 'zesegal@gmail.com',
                        subject: appTemplates.getTemplateByLang(originAppDetails.appId,"emailActivation",req.body.langId || appConfig.appDefaultLangId,"title").replace("{appName}",originAppDetails.appName),
                        html: appTemplates.getTemplateByLang(originAppDetails.appId,"emailActivation",req.body.langId || appConfig.appDefaultLangId,"content").replace('{firstName}',dataUser.firstName).replace('{lastName}',dataUser.lastName).replace('{activationUrl}',originAppDetails.host + "/user/activate?aToken=" + activationHash)
                    };

                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                            return appErrorsConfig.getSystemErrorByLang(error,req.body.langId || appConfig.appDefaultLangId,res)
                        } else {
                            console.log('Email sent: ' + info.response);
                            return res.status(202).send(jsonRes)
                        }
                    });

                } else {
                    session.create(sessiodData)
                        .then(data => {
                            // Set cookie
                            jsonRes.data.attributes.sessionToken=data.sessionId
                            res.cookie('sessionToken', data.sessionId,{ maxAge: appConfig.sessionMaxAge, httpOnly: true })
                            return res.status(201).send(jsonRes)
                        })
                        .catch(err => {
                            return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
                        });
                }

            })
            .catch(err => {
                return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
            });
    }
};

/**
 * Login
 *
 */
exports.login = async function(req, res) {
    var returnUrl=req.query.returnUrl
    dataUser=await account.findOne({
        where: {
                [Op.or]: [
                    {
                        userName: req.body.userName || ''
                    },
                    {
                        email: req.body.email || ''
                    },
                ],
                isBanned: false
            },
        attributes: ['id','userName','firstName','lastName','password','isActivated','langId']
    })
    if (!dataUser) {
        return res.status(401).send({})
    }
    if (req.cookies.sessionToken) {
        return appErrorsConfig.getErrorByLang("user","AlreadyLoggedIn",req.body.langId || dataUser.langId,res)
    }
    const validPassword = await bcrypt.compare(req.body.password, dataUser.password);

    if (validPassword) {
        if (!appConfig.appHostsActivationCheck(req.get('origin'),dataUser.isActivated)) {
            return appErrorsConfig.getErrorByLang("user","NotActivatedError",req.body.langId || dataUser.langId,res)
        }
        var passGen = crypto.randomBytes(20).toString('hex');
        var hashSessionId = bcrypt.hashSync(passGen, bcrypt.genSaltSync(10), null);
        const sessiodData = {
            userId: dataUser.id,
            userName: dataUser.userName,
            lastIp: appConfig.getClientIp(req),
            sessionId: hashSessionId,
        };
        session.create(sessiodData)
            .then(data => {
                let jsonRes={
                    data:{
                        id:data.id,
                        type: "account",
                        attributes: {
                            "userName": dataUser.userName,
                            "firstName": dataUser.firstName,
                            "lastName": dataUser.lastName,
                            "sessionToken": data.sessionId,
                        }
                    },
                    links:[{
                        self: 'returnUrl=' +returnUrl
                    }]
                }

                // Set cookie
                res.cookie('sessionToken', data.sessionId,{ maxAge: appConfig.sessionMaxAge, httpOnly: true })
                return res.status(200).send(jsonRes)
            })
            .catch(err => {
                return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
            });

    } else {
        return res.status(401).send({})
    }
};

/**
 * GET user details
 *
 */
exports.get_user = function(req, res) {
    account.findOne({
            where: {id: req.userId,isDeleted: false,isBanned: false},
            attributes: ['id','userName','firstName','lastName','isActivated','langId']
        }).then(function(user) {
            let jsonRes={
                data:{
                    id:user.id,
                    type: "account",
                    attributes: {
                        "userName": user.userName,
                        "firstName": user.firstName,
                        "lastName": user.lastName,
                        "langId": user.langId
                    }
                }
            }
            if (!appConfig.appHostsActivationCheck(req.get('origin'),user.isActivated)) {
                return appErrorsConfig.getErrorByLang("user","NotActivatedError",req.body.langId || user.langId,res)
            }
            return res.status(200).send(jsonRes)
        }).catch(err => {
            return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
        });
};

/**
 * check login and regenrate sessionToken
 *
 */
exports.check_login = function(req, res) {
    account.findOne({
        where: {id: req.userId,isDeleted: false,isBanned: false},
        attributes: ['id','userName','firstName','lastName','isActivated','langId']
    }).then(function(user) {
        let jsonRes={
            data:{
                id:user.id,
                type: "account",
                attributes: {
                    "userName": user.userName,
                    "firstName": user.firstName,
                    "lastName": user.lastName,
                    "langId": user.langId
                }
            }
        }
        if (!appConfig.appHostsActivationCheck(req.get('origin'),user.isActivated)) {
            return appErrorsConfig.getErrorByLang("user","NotActivatedError",req.body.langId || user.langId,res)
        }
        return res.status(200).send(jsonRes)
    }).catch(err => {
        return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
    });
};

/**
 * DELETE User
 *
 */
exports.delete_user = function(req, res) {
    account.findOne({
        where: {id: req.userId,isBanned: false},
        attributes: ['id','langId']
    }).then(function(user) {
        if (user) {
            console.log(user.id)
            let updateValues = { isDeleted: true };
            account.update(updateValues, {where: {id: user.id,isDeleted: false}})
                .then((result) => {
                    if (result[0]==0) {
                        return appErrorsConfig.getErrorByLang("user","AlreadyDeletedError",req.body.langId || user.langId,res)
                    } else {
                        res.clearCookie("sessionToken");
                        return res.status(204).send({});
                    }
                    // [ 1 ]
                }).catch(err => {
                return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
            });
        } else {
            return res.status(401).send({});
        }
        }).catch(err => {
            return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
        });

};

/**
 * Logout
 *
 */
exports.logout = function(req, res) {
    session.destroy({where: {
        [Op.or]: [
            {
                sessionId: req.cookies.sessionToken
            },
            {
                createdAt: {
                    [Op.lte]: moment().add(30, 'days').toDate()
                },
                userId:req.userId
            },
        ]
    }})
        .then((result) => {
            // here your result is simply an array with number of affected rows
            return res.status(204).send({});
            // [ 1 ]
        }).catch(err => {
            return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
        });
};

/**
 * Activate User
 *
 */
exports.activate_user = function(req, res) {
    account.findOne({
        where: {activateHash: req.query.aToken},
        attributes: ['langId']
    }).then(function(user) {
        if (req.cookies.sessionToken) {
            return appErrorsConfig.getErrorByLang("user","AlreadyLoggedIn",req.body.langId || user.langId,res)
        }
        if (user) {
            let updateValues = { isActivated: true,activateHash:"" };
            account.update(updateValues, {where: {isActivated: false,activateHash:req.query.aToken}})
                .then((dataUser) => {
                    if (dataUser[0]==0) {
                        return appErrorsConfig.getErrorByLang("user","AlreadyActivated",req.body.langId || user.langId,res)
                    } else {
                        return res.status(201).send({});
                    }

                }).catch(err => {
                return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
            });
        } else {
            return appErrorsConfig.getErrorByLang("user","AlreadyActivated",req.body.langId || appConfig.appDefaultLangId,res)
        }
    }).catch(err => {
        return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
    });


};
