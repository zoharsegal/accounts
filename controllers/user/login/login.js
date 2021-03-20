const {google} = require('googleapis');

var account,session,app,db,Op,bcrypt,moment,queryString,axios,transporter,appConfig,appErrorsConfig,appTemplates

exports.set = function(dbVar,OpVar,bcryptVar,momentVar,queryStringVar,axiosVar,transporterVar,appConfigVar,appErrorsConfigVar,appTemplatesVar){
    account=dbVar.accounts
    session=dbVar.sessions
    app=dbVar.apps
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
 * Private functions
 *
 */
exports.create_user_in_db = async function create_user_in_db(userDataJson,res,req,isFacebookGmail,callback) {
    var appData=await app.findOne({where: { id: req.body.appId || null },attributes: ['id']})
    if (!appData) {
        return callback(res.status(401).send({}))
    }
    userDataJson.appId=appData.id
    var hashSessionId = appConfig.getRandomHash()
    account.create(userDataJson)
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
            //check if activation needed for origin app
            if (!appConfig.appHostsActivationCheck(req.get('origin'),false) && !isFacebookGmail) {
                let originAppDetails=appConfig.appNameByOrigin(req.get('origin'))
                var mailOptions = {
                    from: 'no-replay <no-replay@' + originAppDetails.appName + '>',
                    to: req.body.email || null,
                    subject: appTemplates.getTemplateByLang(originAppDetails.appName.toLowerCase(),"emailActivation",req.body.langId || appConfig.appDefaultLangId,"title").replace("{appName}",originAppDetails.appName),
                    html: appTemplates.getTemplateByLang(originAppDetails.appName.toLowerCase(),"emailActivation",req.body.langId || appConfig.appDefaultLangId,"content").replace('{firstName}',dataUser.firstName).replace('{lastName}',dataUser.lastName).replace('{activationUrl}',originAppDetails.host + "/account/activate?aToken=" + userDataJson.activateHash)
                };

                transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                        if (isFacebookGmail) {
                            return callback();
                        }
                        return callback(appErrorsConfig.getSystemError(error,res))
                    } else {
                        console.log('Email sent: ' + info.response);
                        if (isFacebookGmail) {
                            return callback();
                        }
                        delete userDataJson.password
                        delete userDataJson.password_confirmation
                        delete userDataJson.activateHash
                        var jsonRes={
                            data:{
                                id:dataUser.id,
                                type: "account",
                                attributes: userDataJson
                            }
                        }
                        db.sequelize.query('INSERT INTO accounts.permission_app_accounts(value, "accountId", "permissionId", "createdAt", "updatedAt")' +
                            ' SELECT "permissionDefaultParams",:accountId,id, current_timestamp,current_timestamp' +
                            ' FROM accounts.permissions ' +
                            ' WHERE "appId"=1',
                            {
                                replacements: { accountId: dataUser.id }
                            }).then(function(user) {
                                return callback(res.status(202).send(jsonRes))
                            }).catch(err => {
                                return appErrorsConfig.getSystemError(err,res)
                            });
                    }
                });

            } else {
                session.create(sessiodData)
                    .then(data => {
                        // Set cookie
                        jsonRes.data.attributes.sessionToken=data.sessionId
                        res.cookie('sessionToken', data.sessionId,{ maxAge: appConfig.sessionMaxAge, httpOnly: true })
                        if (isFacebookGmail) {
                            return callback();
                        }
                        delete userDataJson.password
                        delete userDataJson.password_confirmation
                        delete userDataJson.activateHash
                        var jsonRes={
                            data:{
                                id:dataUser.id,
                                type: "account",
                                attributes: userDataJson
                            }
                        }
                        db.sequelize.query('INSERT INTO accounts.permission_app_accounts(value, "accountId", "permissionId", "createdAt", "updatedAt")' +
                            ' SELECT "permissionDefaultParams",:accountId,id, current_timestamp,current_timestamp' +
                            ' FROM accounts.permissions ' +
                            ' WHERE "appId"=1',
                            {
                                replacements: { accountId: dataUser.id }
                            }).then(function(user) {
                            return callback(res.status(202).send(jsonRes))
                        }).catch(err => {
                            return appErrorsConfig.getSystemError(err,res)
                        });
                    })
                    .catch(err => {
                        if (isFacebookGmail) {
                            return callback();
                        }
                        return callback(appErrorsConfig.getSystemError(err,res))
                    });
            }

        })
        .catch(err => {
            if (isFacebookGmail) {
                return callback();
            }
            return callback(appErrorsConfig.getSystemError(err,res))
        });
}

function getGoogleAuthURL(url) {
    const oauth2Client = new google.auth.OAuth2(
        appConfig.gmailAppId,
        appConfig.gmailAppSecret,
        url
        /*
         * This is where Google will redirect the user after they
         * give permission to your application
         */
        //https://example.com/auth/google`,
    );
    /*
     * Generate a url that asks permissions to the user's email and profile
     */
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes, // If you only need one scope you can pass it as string
        redirect_uri:(appConfig.isSSL ? 'https' : 'http') + '://' + appConfig.appDomain + '/account/login_gmail?app=' + encodeURIComponent("http://localhost")
    });
}


async function getGoogleUser( code,url ) {
    const oauth2Client = new google.auth.OAuth2(
        appConfig.gmailAppId,
        appConfig.gmailAppSecret,
        url
        /*
         * This is where Google will redirect the user after they
         * give permission to your application
         */
        //https://example.com/auth/google`,
    );

    const { tokens } = await oauth2Client.getToken(code);

    // Fetch the user's profile with the access token and bearer
    const googleUser = await axios
        .get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
            {
                headers: {
                    Authorization: `Bearer ${tokens.id_token}`,
                },
            },
        )
        .then(res => res.data)
        .catch(error => {
            throw new Error(error.message);
        });
    return googleUser;
}

/**
 * Login Regular
 *
 */
exports.login = async function(req, res) {
    var returnUrl=req.query.returnUrl
    var whereCluase={
        userName: req.body.emailuserName || '',
        isBanned: false,
        isDeleted: false
    }
    console.log(req.body.emailuserName)
    if (req.body.emailuserName.includes("@")) {
        whereCluase={
            email: req.body.emailuserName || '',
            isBanned: false,
            isDeleted: false
        }
    }
    var dataUser=await account.findOne({
        where: whereCluase,
        attributes: ['id','userName','email','firstName','lastName','password','isActivated','langId','activateHash']
    })
    if (!dataUser) {
        return res.status(401).send({})
    }
    if (req.cookies.sessionToken) {
        return appErrorsConfig.getError("user","AlreadyLoggedIn",res)
    }
    const validPassword = await bcrypt.compare(req.body.password || null, dataUser.password);
    if (validPassword) {
        if (!appConfig.appHostsActivationCheck(req.get('origin'),dataUser.isActivated)) {
            let originAppDetails=appConfig.appNameByOrigin(req.get('origin'))
            var mailOptions = {
                from: 'no-replay <no-replay@' + originAppDetails.appName + '>',
                to: dataUser.email || null,
                subject: appTemplates.getTemplateByLang(originAppDetails.appName.toLowerCase(),"emailActivation",dataUser.langId || appConfig.appDefaultLangId,"title").replace("{appName}",originAppDetails.appName),
                html: appTemplates.getTemplateByLang(originAppDetails.appName.toLowerCase(),"emailActivation",dataUser.langId || appConfig.appDefaultLangId,"content").replace('{firstName}',dataUser.firstName).replace('{lastName}',dataUser.lastName).replace('{activationUrl}',originAppDetails.host + "/account/activate?aToken=" + dataUser.activateHash)
            };

            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    return appErrorsConfig.getSystemError(error,res)
                } else {
                    console.log('Email sent: ' + info.response);
                    return appErrorsConfig.getError("user","NotActivatedError",res)
                }
            });

        } else {
            var hashSessionId = appConfig.getRandomHash()
            const sessiodData = {
                userId: dataUser.id,
                userName: dataUser.userName,
                lastIp: appConfig.getClientIp(req),
                sessionId: hashSessionId,
            };

            let updateValues = {
                lastIp: appConfig.getClientIp(req)
            };

            session.create(sessiodData)
                .then(data => {
                    account.update(updateValues, {where: {id: dataUser.id}})
                        .then((result) => {
                            let jsonRes={
                                data:{
                                    id:dataUser.id,
                                    type: "account",
                                    attributes: {
                                        "userName": dataUser.userName,
                                        "firstName": dataUser.firstName,
                                        "lastName": dataUser.lastName,
                                    }
                                },
                                links:[{
                                    self: 'returnUrl=' +returnUrl
                                }]
                            }

                            // Set cookie
                            res.cookie('sessionToken', data.sessionId,{ maxAge: appConfig.sessionMaxAge, httpOnly: true })
                            return res.status(200).send(jsonRes)
                        }).catch(err => {
                        return appErrorsConfig.getSystemError(err,res)
                    });
                })
                .catch(err => {
                    return appErrorsConfig.getSystemError(err,res)
                });
        }
    } else {
        return res.status(401).send({})
    }
};

/**
 * Login With Facebook
 *
 */
exports.login_with_facebook = async function(req, res) {
    if (req.cookies.sessionToken) {
        return appErrorsConfig.getError("user","AlreadyLoggedIn",res)
    }
    var redirectUrl=(appConfig.isSSL ? 'https' : 'http') + '://' + appConfig.appDomain + '/account/login_facebook?app=' + encodeURIComponent("http://localhost")
    console.log(redirectUrl)
    if (!req.query.code) {
        const stringifiedParams = queryString.stringify({
            client_id: appConfig.facebookAppId,
            redirect_uri: redirectUrl,
            scope: ['email', 'public_profile'].join(','), // comma seperated string
            response_type: 'code',
            auth_type: 'rerequest',
            display: 'popup',
        });

        const facebookLoginUrl = `https://www.facebook.com/v4.0/dialog/oauth?${stringifiedParams}`;
        return res.redirect(facebookLoginUrl);
        // return res.status(200).send({ff:"ff"})
    } else {
        axios.get('https://graph.facebook.com/oauth/access_token', {
            params: {
                client_id: appConfig.facebookAppId,
                client_secret:appConfig.facebookAppSecret,
                redirect_uri: redirectUrl,
                code: req.query.code
            }
        })
            .then(function (response) {
                console.log(response.data.access_token);
                axios.get('https://graph.facebook.com/me', {
                    params: {
                        fields: ['id', 'email', 'first_name', 'last_name'].join(','),
                        access_token: response.data.access_token,
                    }
                })
                    .then(function (response) {
                        //facebook square image: https://graph.facebook.com/{profile_id}/picture?type=large&access_token={app_access_token}

                        account.findOne({
                            where: {email: response.data.email,isBanned:false,isDeleted:false},
                            attributes: ['id','langId','userName']
                        }).then(function(user) {
                            if (!user) {
                                var activationHash = appConfig.getRandomHash()
                                var newPassword = appConfig.getRandomHash()
                                console.log(response.data)
                                const user = {
                                    userName: response.data.email,
                                    firstName: response.data.first_name,
                                    lastName: response.data.last_name,
                                    password: newPassword,
                                    password_confirmation: newPassword,
                                    email: response.data.email,
                                    langId: req.body.langId || appConfig.appDefaultLangId,
                                    activateHash: activationHash,
                                    isActivated:true,
                                    lastIp: appConfig.getClientIp(req)
                                };
                                create_user_in_db(user,res,req,true,function(responseReturn){
                                    // return responseReturn
                                    //return res.redirect(decodeURIComponent(req.query.app));
                                    return res.status(200).send('<script>alert("hi!");parent.postMessage("done","*");</script>')
                                    // return responseReturn
                                })
                            } else {
                                session.destroy({where: {userId:user.id}})
                                    .then((result) => {
                                        var hashSessionId = appConfig.getRandomHash()
                                        const sessiodData = {
                                            userId: user.id,
                                            userName: user.userName,
                                            lastIp: appConfig.getClientIp(req),
                                            sessionId: hashSessionId,
                                        };
                                        res.clearCookie("sessionToken");

                                        session.create(sessiodData)
                                            .then(data => {
                                                res.cookie('sessionToken', data.sessionId,{ maxAge: appConfig.sessionMaxAge, httpOnly: true })
                                                var returnUrl=req.query.returnUrl
                                                let jsonRes={
                                                    data:{
                                                        id:data.id,
                                                        type: "account",
                                                        attributes: {
                                                            "email": user.email,
                                                            "firstName": user.firstName,
                                                            "lastName": user.lastName,
                                                            "sessionToken": data.sessionId,
                                                        }
                                                    },
                                                    links:[{
                                                        self: 'returnUrl=' +redirectUrl
                                                    }]
                                                }

                                                // Set cookie
                                                res.cookie('sessionToken', data.sessionId,{ maxAge: appConfig.sessionMaxAge, httpOnly: true })
                                                // return res.status(200).send(jsonRes)
                                                return res.redirect(decodeURIComponent(req.query.app));
                                            })
                                            .catch(err => {
                                                return appErrorsConfig.getSystemError(err,res)
                                            });
                                    }).catch(err => {
                                    res.clearCookie("sessionToken");
                                    return appErrorsConfig.getSystemError(err,res)
                                });

                            }
                        }).catch(err => {
                            return appErrorsConfig.getSystemError(err,res)
                        });




                    })
                    .catch(function (error) {
                        return res.status(401).send(error)
                    });
                // return res.status(200).send(response.data.access_token)
            })
            .catch(function (error) {
                return res.status(401).send(error)
            });

    }

};

/**
 * Login With Gmail
 *
 */
exports.login_with_gmail = async function(req, res) {
    if (req.cookies.sessionToken) {
        return appErrorsConfig.getError("user","AlreadyLoggedIn",res)
    }
    var redirectUrl=(appConfig.isSSL ? 'https' : 'http') + '://' + appConfig.appDomain + '/account/login_gmail?app=' + encodeURIComponent("http://localhost")
    if (!req.query.code) {
        res.redirect(getGoogleAuthURL(redirectUrl))
    } else {
        var code=req.query.code
        var response=await getGoogleUser(code,redirectUrl)
        account.findOne({
            where: {email: response.email,isBanned:false,isDeleted:false},
            attributes: ['id','langId','userName']
        }).then(function(user) {
            if (!user) {
                var activationHash = appConfig.getRandomHash()
                var newPassword = appConfig.getRandomHash()
                const user = {
                    userName: response.email,
                    firstName: response.given_name,
                    lastName: response.family_name,
                    password: newPassword,
                    password_confirmation: newPassword,
                    email: response.email,
                    langId: req.body.langId || appConfig.appDefaultLangId,
                    activateHash: activationHash,
                    isActivated:true,
                    lastIp: appConfig.getClientIp(req)
                };
                create_user_in_db(user,res,req,true,function(responseReturn){
                    // return responseReturn
                    //return res.redirect(decodeURIComponent(req.query.app));
                    return res.status(200).send('<script>alert("hi!");parent.postMessage("done","*");</script>')
                    // return responseReturn
                })
            } else {
                session.destroy({where: {userId:user.id}})
                    .then((result) => {
                        var hashSessionId = appConfig.getRandomHash()
                        const sessiodData = {
                            userId: user.id,
                            userName: user.userName,
                            lastIp: appConfig.getClientIp(req),
                            sessionId: hashSessionId,
                        };
                        res.clearCookie("sessionToken");

                        session.create(sessiodData)
                            .then(data => {
                                res.cookie('sessionToken', data.sessionId,{ maxAge: appConfig.sessionMaxAge, httpOnly: true })
                                var returnUrl=req.query.returnUrl
                                let jsonRes={
                                    data:{
                                        id:data.id,
                                        type: "account",
                                        attributes: {
                                            "email": user.email,
                                            "firstName": user.firstName,
                                            "lastName": user.lastName,
                                            "sessionToken": data.sessionId,
                                        }
                                    },
                                    links:[{
                                        self: 'returnUrl=' +redirectUrl
                                    }]
                                }

                                // Set cookie
                                res.cookie('sessionToken', data.sessionId,{ maxAge: appConfig.sessionMaxAge, httpOnly: true })
                                // return res.status(200).send(jsonRes)
                                return res.redirect(decodeURIComponent(req.query.app));
                            })
                            .catch(err => {
                                return appErrorsConfig.getSystemError(err,res)
                            });
                    }).catch(err => {
                    res.clearCookie("sessionToken");
                    return appErrorsConfig.getSystemError(err,res)
                });

            }
        }).catch(err => {
            return appErrorsConfig.getSystemError(err,res)
        });

    }


};
