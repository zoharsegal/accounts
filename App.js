
const appConfig = require("./environment/app.config");
const appTemplates = require("./environment/app.templates");
const appErrorsConfig = require("./environment/app.errors");
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const express = require('express');
const cookieParser = require('cookie-parser')
const usersRouter = require('./routes/User');
const db = require("./models");

db.sequelize.sync();
const session = db.sessions;
const app = express()



/**
 * Logic functions
 *
 * Main App Server
 * Routes Declaration
 *
 * @User
 *
 */



const noSessionTokenNeededRoutes=[
    {
        route: "/user",
        methods:['POST']
    },
    {
        route: "/user/login",
        methods:['POST']
    },
    {
        route: "/user/activate",
        methods:['GET']
    }
]

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
    if (!(appConfig.skipCSRFProtectionRoutes.indexOf(req.originalUrl) > -1)) {
        try {
            payload = jwt.verify(req.body.csrf, appConfig.jwtSecret,);
        } catch(err) {
            return appErrorsConfig.getErrorByLang("system","CSRFError",req.body.langId || appConfig.appDefaultLangId,res)
        }
    }
    //check if route can skip sessionId authentication
    if (appConfig.noSessionTokenNeededRoutesCheck(req.originalUrl,req.method)) {
        return next()
    }
    //check if route exists with specific method
    if (!appConfig.routeExistsCheck(req.originalUrl,req.method)) {
        return res.status(404).send({});
    }
    req.userName=payload.userName
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
        return appErrorsConfig.getSystemErrorByLang(err,req.body.langId || appConfig.appDefaultLangId,res)
    });

}

app.use(cookieParser())
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use('/user',preAccessCheck, usersRouter);

/**
 * Generate CSRF Token, only premitted Ips can access this
 *
 */
app.get('/csrf', (req, res) => {
    if (appConfig.allowedToGetCSRFIps.indexOf(appConfig.getClientIp(req)) > -1) {
        var token = jwt.sign({
            userName: req.query.userName
        }, appConfig.jwtSecret,{ expiresIn: '1h' });
        return res.status(201).send({token:token});
    } else {
        return res.status(401).send({});
    }
})
app.listen(appConfig.appPort, () => {
    console.log(`${appConfig.appName} App Listening at ${(appConfig.isSSL ? "https" : "http")}://${appConfig.appDomain}:${appConfig.appPort}${appConfig.appUrl}`)
})
