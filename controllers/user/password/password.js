const {google} = require('googleapis');

var account,session,db,Op,bcrypt,moment,queryString,axios,transporter,appConfig,appErrorsConfig,appTemplates

exports.set = function(dbVar,OpVar,bcryptVar,momentVar,queryStringVar,axiosVar,transporterVar,appConfigVar,appErrorsConfigVar,appTemplatesVar){
    account=dbVar.accounts
    session=dbVar.sessions
    db=dbVar
    Op=OpVar
    bcrypt=bcryptVar
    moment=momentVar
    queryString=queryStringVar
    axios=axiosVar
    transporter=transporterVar
    appConfig=appConfigVar
    appErrorsConfig=appErrorsConfigVar
    appTemplates=appTemplatesVar
};

/**
 * Forgot Password
 *
 */
exports.forgot_password = async function(req, res) {
    var whereCluase={
        userName: req.body.userName || '',
        isBanned: false,
        isDeleted: false,
        isActivated: true
    }
    if (req.body.email) {
        whereCluase={
            email: req.body.email || '',
            isBanned: false,
            isDeleted: false,
            isActivated: true
        }
    }
    account.findOne({
        where: whereCluase,
        attributes: ['id','langId','firstName','lastName','email']
    }).then(function(user) {
        if (user) {
            var newPasswordHash = appConfig.getRandomHash()
            const updateValues = {
                newPasswordHash: newPasswordHash,
                newPasswordHashCreatedAt: db.sequelize.literal('CURRENT_TIMESTAMP'),
            };
            account.update(updateValues, {
                where: {id: user.id},
                individualHooks: true
            })
                .then((result) => {
                    let originAppDetails=appConfig.appNameByOrigin(req.get('origin'))
                    var mailOptions = {
                        from: 'no-replay <no-replay@' + originAppDetails.appName + '>',
                        to: user.email,
                        subject: appTemplates.getTemplateByLang(originAppDetails.appId,"forgotPassword",user.langId || appConfig.appDefaultLangId,"title").replace("{appName}",originAppDetails.appName),
                        html: appTemplates.getTemplateByLang(originAppDetails.appId,"forgotPassword",user.langId || appConfig.appDefaultLangId,"content").replace('{firstName}',user.firstName).replace('{lastName}',user.lastName).replace('{forgotPasswordActivationUrl}',originAppDetails.host + "/user/forgot?npToken=" + newPasswordHash)
                    };
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            return appErrorsConfig.getSystemError(error,res)
                        } else {
                            console.log('Email sent: ' + info.response);
                            return res.status(202).send({})
                        }
                    });
                }).catch(err => {
                return appErrorsConfig.getSystemError(err,res)
            });
        } else {
            return res.status(401).send({});
        }
    }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });
};

/**
 * Forgot Done
 *
 */
exports.forgot_password_done = function(req, res) {
    account.findOne({
        where: {
            newPasswordHash: req.query.npToken,
            newPasswordHashCreatedAt: {
                [Op.lte]: moment().add(1, 'days').toDate()
            },
        },
        attributes: ['id','langId'],
    }).then(function(user) {
        if (user) {
            let updateValues = {
                newPasswordHash:null,
                newPasswordHashCreatedAt:null,
                password: req.body.password || null,
                password_confirmation: req.body.password_confirmation || null,
            };
            account.update(updateValues, {
                where: {id:user.id},
                individualHooks: true,
            })
                .then((dataUser) => {
                    return res.status(201).send({});
                }).catch(err => {
                return appErrorsConfig.getSystemError(err,res)
            });
        } else {
            return appErrorsConfig.getSystemError("Link Not Exists Anymore",res)
        }
    }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });


};


/**
 * UPDATE Password
 *
 */

exports.update_password = async function (req, res) {
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
    dataUser=await account.findOne({
        where: whereClause,
        attributes: ['id','langId','password']
    })
    if (!req.body.password_old) {
        return res.status(422).send({})
    }
    if (!dataUser) {
        return res.status(401).send({})
    }
    const validPassword = await bcrypt.compare(req.body.password_old, dataUser.password);
    if (!validPassword) {
        return res.status(403).send({})
    }
    const updateValues = {
        password_old: req.body.password_old || null,
        password: req.body.password || null,
        password_confirmation: req.body.password_confirmation || null,
        lastIp: appConfig.getClientIp(req)
    };
    account.update(updateValues, {
        where: {id: dataUser.id},
        individualHooks: true
    })
        .then((result) => {
            updateValues.password=null
            updateValues.password_old=null
            updateValues.password_confirmation=null
            var jsonRes={
                data:{
                    id:dataUser.id,
                    type: "account",
                    attributes: updateValues
                }
            }
            return res.status(200).send(jsonRes);
        }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });
};
