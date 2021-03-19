
const appConfig = require("./environment/app.config");
const appTemplates = require("./environment/app.templates");
const appErrorsConfig = require("./environment/app.errors");
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const express = require('express');
const cookieParser = require('cookie-parser');
const accountsRouter = require('./routes/Account');
const organizationRouter = require('./routes/Organization.js');
const companyRouter = require('./routes/Company.js');
const departmentRouter = require('./routes/Department.js');
const departmentSubRouter = require('./routes/DepartmentSubs.js');
const db = require("./models");

db.sequelize.sync();
const session = db.sessions;
const appDb = db.apps;
const app = express()

/*
to delete!!!
 */
const cors = require('cors')
const corsOptions = {
    origin: true,
    credentials: true
}
app.options('*', cors(corsOptions));
/*
end to delete!
 */


/**
 * Logic functions
 *
 * Main App Server
 * Routes Declaration
 *
 * @User
 *
 */


/**
 * Pre Access Check
 * check token, and premitted hosts to access Accounts API
 */
preAccessCheck = function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', appConfig.headers["Access-Control-Allow-Credentials"]);
    if (appConfig.appHostsCheck((req.get('origin')))) {
        res.header('Access-Control-Allow-Origin', req.get('origin'));
    }
    res.header('Access-Control-Allow-Methods', appConfig.headers["Access-Control-Allow-Methods"]);
    //check if origin can access API
    if (!appConfig.appHostsCheck(req.get('origin'),false,false)) {
        return res.status(401).send({});
    }
    //csrf check protection
    var payload
    // if (!(appConfig.skipCSRFProtectionRoutes.indexOf(req.originalUrl) > -1)) {
    /*
    to delete
     */
    // if (req.originalUrl.split('?')[0]=='/user/login_gmail') {
    //     return next()
    // }
    //check csrf 1
    try {
        payload = jwt.verify(req.body.csrf, appConfig.jwtSecret,);
    } catch(err) {
        return appErrorsConfig.getError("system","CSRFError",res)
    }
    // }
    //check if route can skip sessionId authentication
    if (appConfig.noSessionTokenNeededRoutesCheck(req.originalUrl,req.method)) {
        return next()
    }
    req.userName=payload.userName
    //check csrf 2
    if (req.userName=="" || payload.appId!=req.body.appId) {
        return appErrorsConfig.getError("system","CSRFError",res)
    }
    //get UseId by sessionId
    session.findOne({
        where: {sessionId: req.cookies.sessionToken || "",userName:req.userName || ""},
        attributes: ['userId']
    }).then(function(user) {
        if (user) {
            req.userId=user.userId
            next()
        } else {
            return res.status(401).send({});
        }
    }).catch(err => {
        res.clearCookie("sessionToken");
        return appErrorsConfig.getSystemError(err,res)
    });

}

//get all apps details
appDb.findAll({
    where: {},
    attributes: ['id','appName','host','needAccountActivation']
}).then(function(data) {
    for (var i = 0; i < data.length; i++) {
        appConfig.allowedToDirectApiRequestIps.push(data[i].ip)
    }
    appConfig.allowedToDirectApiRequestIps.push("::1")
    appConfig.appHosts=data
}).catch(err => {
    process.exit(1)
});

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(cookieParser())
app.use('/account',preAccessCheck, accountsRouter);
app.use('/organization',preAccessCheck, organizationRouter);
app.use('/company',preAccessCheck, companyRouter);
app.use('/department',preAccessCheck, departmentRouter);
app.use('/department_sub',preAccessCheck, departmentSubRouter);

/**
 * Generate CSRF Token, only premitted Ips can access this
 *
 */
app.post('/csrf', (req, res) => {
    res.header('Access-Control-Allow-Credentials', appConfig.headers["Access-Control-Allow-Credentials"]);
    if (appConfig.appHostsCheck((req.get('origin')))) {
        res.header('Access-Control-Allow-Origin', req.get('origin'));
    }
    res.header('Access-Control-Allow-Methods', appConfig.headers["Access-Control-Allow-Methods"]);
    if (appConfig.allowedToDirectApiRequestIps.indexOf(appConfig.getClientIp(req)) > -1) {
        var token = jwt.sign({
            userName: req.body.userName,
            appId: req.body.appId
        }, appConfig.jwtSecret,{ expiresIn: appConfig.csrfExpireTime });
        return res.status(201).send({token:token});
    } else {
        return res.status(401).send({});
    }
})
app.listen(appConfig.appPort, () => {
    console.log(`${appConfig.appName} App Listening at ${(appConfig.isSSL ? "https" : "http")}://${appConfig.appDomain}:${appConfig.appUrl}`)
})
