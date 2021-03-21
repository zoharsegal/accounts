const appConfig = require("../environment/app.config");
const appTemplates = require("../environment/app.templates");
const appErrorsConfig = require("../environment/app.errors");
const db = require("../models");
const account = db.accounts;
const session = db.sessions;
const organization = db.organizations;
const company = db.companies;
const department = db.departments;
const department_sub = db.departments_sub;
const permissions = db.permissions;
const permission_app_account = db.permission_app_accounts;
const Op = db.Sequelize.Op;
const moment = require('moment');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const queryString = require('query-string');
const axios = require('axios').default;

var transporter = nodemailer.createTransport({
    host: appConfig.smtpHost,
    port: appConfig.smtpPort,
    secure: appConfig.smtpIsSSL, // true for 465, false for other ports
    auth: {
        user: appConfig.smtpUserName, // generated ethereal user
        pass: appConfig.smtpPassword  // generated ethereal password
    }
});

const login = require('./user/login/login.js');
login.set(db,Op,bcrypt,moment,queryString,axios,transporter,appConfig,appErrorsConfig,appTemplates)

const password = require('./user/password/password.js');
password.set(db,Op,bcrypt,moment,queryString,axios,transporter,appConfig,appErrorsConfig,appTemplates)

/**
 * Private functions
 *
 */



/**
 * CREATE new user(Regular/Owned AppAPI/Affiliated Registration)
 *
 */

exports.create = async function(req, res) {
    var activationHash = appConfig.getRandomHash()
    const userData = {
        userName: req.body.userName || null,
        firstName: req.body.firstName || null,
        lastName: req.body.lastName || null,
        password: req.body.password || null,
        password_confirmation: req.body.password_confirmation || null,
        email: req.body.email || null,
        langId: req.body.langId || appConfig.appDefaultLangId,
        activateHash: activationHash,
        lastIp: appConfig.getClientIp(req),
        affiliateId: req.body.affiliateId || null,
        organizationId: null,
        companyId: null,
        departmentId: null,
        departmentSubId: null,
    };
    //create owned account
    if (req.cookies.sessionToken) {
        var user=await session.findOne({
            where: {sessionId: req.cookies.sessionToken},
            attributes: ['userId']
        })
        if (!user) {
            return res.status(401).send({});
        }
        userData.ownerAccountId=user.userId
        //check if entity(organization/company/etc owned by owner account)
        if (req.body.entityId && req.body.entityName) {
            let entityWhere={
                id: req.body.entityId,
                accountId:user.userId
            }
            var data
            switch(req.body.entityName) {
                case 'organization':
                    data=await organization.findOne({where: entityWhere,attributes: ['id']})
                    userData.organizationId=(data ? data.id : null)
                    break;
                case 'company':
                    data=await company.findOne({where: entityWhere,attributes: ['id']})
                    userData.companyId=(data ? data.id : null)
                    break;
                case 'department':
                    data=await department.findOne({where: entityWhere,attributes: ['id']})
                    userData.departmentId=(data ? data.id : null)
                    break;
                case 'department_sub':
                    data=await department_sub.findOne({where: entityWhere,attributes: ['id']})
                    userData.departmentSubId=(data ? data.id : null)
                    break;
                // code block
            }

            if (!data) {
                return res.status(403).send({})
            }
            login.create_user_in_db(userData,res,req,false,function(responseReturn){
                return responseReturn
            })
        } else {
            login.create_user_in_db(userData,res,req,false,function(responseReturn){
                return responseReturn
            })
        }

    //create regular account
    } else {
        login.create_user_in_db(userData,res,req,false,function(responseReturn){
            return responseReturn
        })

    }
};

/**
 * UPDATE AppAPI/ owned account
 *
 */

exports.update = async function(req, res) {
    const updateValues = {
        firstName: req.body.firstName || null,
        lastName: req.body.lastName || null,
        langId: req.body.langId || null,
        lastIp: appConfig.getClientIp(req),
        affiliateId: req.body.affiliateId || null,
        organizationId: null,
        companyId: null,
        departmentId: null,
        departmentSubId: null,
    };
    //check if entity(organization/company/etc owned by owner account)
    if (req.body.entityId && req.body.entityName) {
        let entityWhere={
            id: req.body.entityId,
            accountId:req.userId
        }
        var data
        switch(req.body.entityName) {
            case 'organization':
                data=await organization.findOne({where: entityWhere,attributes: ['id']})
                updateValues.organizationId=(data ? data.id : null)
                break;
            case 'company':
                data=await company.findOne({where: entityWhere,attributes: ['id']})
                updateValues.companyId=(data ? data.id : null)
                break;
            case 'department':
                data=await department.findOne({where: entityWhere,attributes: ['id']})
                updateValues.departmentId=(data ? data.id : null)
                break;
            case 'department_sub':
                data=await department_sub.findOne({where: entityWhere,attributes: ['id']})
                updateValues.departmentSubId=(data ? data.id : null)
                break;
            // code block
        }
        if (!data) {
            return res.status(403).send({})
        }
    }
    var whereClause={
        id: req.userId,
        isBanned: false,
        isDeleted: false
    }
    if (req.body.ownedUserId) {
        whereClause={
            ownerAccountId:req.userId,
            id: req.body.ownedUserId || -1,
            isBanned: false,
            isDeleted: false
        }
    }
    account.update(updateValues, {
        where: whereClause,
    })
        .then((result) => {
            if (result[0]>0) {
                var jsonRes={
                    data:{
                        id:whereClause.id,
                        type: "account",
                        attributes: updateValues
                    }
                }
                return res.status(200).send(jsonRes);
            } else {
                return res.status(401).send({});
            }

        }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });
};

/**
 * UPDATE Password
 *
 */

exports.update_password = password.update_password

/**
 * Login
 *
 */
exports.login = login.login

/**
 * Login With Facebook
 *
 */
exports.login_with_facebook = login.login_with_facebook


/**
 * Login With Gmail
 *
 */
exports.login_with_gmail = login.login_with_gmail

/**
 * Forgot Password
 *
 */
exports.forgot_password = password.forgot_password


/**
 * Forgot Done
 *
 */
exports.forgot_password_done = password.forgot_password_done

/**
 * GET user details/ List of owned users
 *
 */
exports.get = function(req, res) {
    var id = req.params.id;
    var whereClause={id: req.userId,isDeleted: false,isBanned: false,isActivated: true}
    if (id) {
        if (id=="-1") {
            whereClause={ownerAccountId: req.userId,isDeleted: false,isActivated: true}
        } else {
            whereClause={ownerAccountId: req.userId, id:id,isDeleted: false,isActivated: true}
        }

    }
    account.findAll({
            where: whereClause,
            attributes: ['id','userName','firstName','lastName','isActivated','langId','state','address','phone','countryId','ownerAccountId','affiliateId']
        }).then(function(data) {
            var jsonResult={data:[]}
            for (var i = 0; i < data.length; i++) {
                jsonResult.data.push({
                    id:data[i].id,
                    type:"account",
                    attributes:data[i],

                })
            }
            jsonResult.data.forEach(function(v){ delete v.attributes.id });
            return res.status(200).send(jsonResult)
        }).catch(err => {
            return appErrorsConfig.getSystemError(err,res)
        });
};



/**
 * check login(ping requests)
 *
 */
exports.ping = async function(req, res) {
    console.log("ping")
    if (!req.cookies.sessionToken) {
        let jsonRes={
            data:{
                id:null,
                type: "account",
                attributes: {
                    dirFrom:"ltr",
                    dirTo:"rtl",
                    alignFrom:"left",
                    alignTo:"right",
                    appVersion:1
                }
            }
        }
        return res.status(200).send(jsonRes)
    }
    var sessionData=await session.findOne({
        where: {sessionId: req.cookies.sessionToken || null},
        attributes: ['userId']
    })
    if (!sessionData) {
        return res.status(204).send({})
    } else {
        req.userId=sessionData.userId
    }
    account.findOne({
        where: {id: req.userId,isDeleted: false,isBanned: false},
        attributes: ['id','userName','firstName','lastName','isActivated','langId'],
        include: {
            model: permission_app_account,
            include: {
                model: permissions,
                where: {
                    appId: req.body.appId || -1
                },
                attributes: []
            }
        }
    }).then(function(user) {
        let userTmp=user
        userTmp.dataValues.dirFrom="rtl";
        userTmp.dataValues.dirTo="ltr";
        userTmp.dataValues.alignFrom="rtl";
        userTmp.dataValues.alignTo="rtl";
        userTmp.dataValues.appVersion=1;
        let jsonRes={
            data:{
                id:user.id,
                type: "account",
                attributes: userTmp
            }
        }
        return res.status(200).send(jsonRes)
    }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });
};

/**
 * DELETE User, or owned user
 *
 */
exports.delete = function(req, res) {
    var whereClause={
        id: req.userId,isBanned: false,isDeleted: false
    }
    if (req.body.ids) {
        var ids
        try {
            ids=JSON.parse(req.body.ids)
        } catch(err) {
            return appErrorsConfig.getSystemError("",res)
        }
        if (ids.some(isNaN)) {
            return appErrorsConfig.getSystemError("",res)
        }

        whereClause={
            ownerAccountId: req.userId,id: ids,isBanned: false,isDeleted: false,isActivated: true
        }

    }
    const updateData = {
        isDeleted: true
    };
    account.update(updateData, {
        where: whereClause})
        .then((result) => {
            res.clearCookie("sessionToken");
            return res.status(204).send({});
        }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });

};

/**
 * Logout
 *
 */
exports.logout = function(req, res) {
    if (!req.cookies.sessionToken) {
        return res.status(204).send({});
    }
    session.destroy({where: {
        [Op.or]: [
            {
                sessionId: req.cookies.sessionToken
            },
        ]
    }})
        .then((result) => {
            // here your result is simply an array with number of affected rows
            res.clearCookie("sessionToken");
            return res.status(204).send({});
            // [ 1 ]
        }).catch(err => {
            res.clearCookie("sessionToken");
            return appErrorsConfig.getSystemError(err,res)
        });
};

/**
 * Activate User
 *
 */
exports.activate = function(req, res) {

    account.findOne({
        where: {activateHash: req.query.aToken,isActivated:false},
        attributes: ['id','langId']
    }).then(function(user) {
        if (user) {
            if (req.cookies.sessionToken) {
                return appErrorsConfig.getError("user","AlreadyLoggedIn",res)
            }
            const updateValues = {
                isActivated: true,
            };
            account.update(updateValues, {
                where: {id: user.id}
            })
                .then((result) => {
                    return res.status(201).send({});
                }).catch(err => {
                    return appErrorsConfig.getSystemError(err,res)
                });
        } else {
            return appErrorsConfig.getError("user","AlreadyActivated",res)
        }
    }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });


};
