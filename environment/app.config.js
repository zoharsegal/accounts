const crypto = require("crypto");
const bcrypt = require('bcrypt');
/**
 * General App Config
 */
module.exports = {
    appName: 'Accounts',
    appDefaultLangId: 12,
    isSSL: false,
    appDomain: 'localhost:82',
    appPort: 82,
    appUrl: '/',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpIsSSL: true,
    smtpUserName: "xxxxx",
    smtpPassword: "xxxxxxx",
    allowedToDirectApiRequestIps:[],
    facebookAppId:"xxxxxxxxxxxx",
    facebookAppSecret:"xxxxxxxxx",
    gmailAppId:"xxxxx",
    gmailAppSecret:"xxxxxxxx",
    jwtSecret:"xxxxxxxxx",
    jswFixedVerify:"xxxxxxxxxxx",
    /**
     * Session params
     */
    sessionMaxAge: 30 * 24 * 60 * 60 * 1000, // 30 * 24 * 60 * 60 * 1000 -30 days
    csrfExpireTime: "1h",
    routes: [
        {
            route: "/account",
            methods:['POST'],
            isSessionCheckNeeded:false
        },
        {
            route: "/account/ping",
            methods:['POST'],
            isSessionCheckNeeded:false
        },
        {
            route: "/account/logout",
            methods:['POST'],
            isSessionCheckNeeded:false
        },
        {
            route: "/account/login",
            methods:['POST'],
            isSessionCheckNeeded:false
        },
        {
            route: "/account/activate",
            methods:['GET'],
            isSessionCheckNeeded:false
        },
        {
            route: "/account/login_facebook",
            methods:['GET'],
            isSessionCheckNeeded:false
        },
        {
            route: "/account/login_gmail",
            methods:['GET'],
            isSessionCheckNeeded:false
        },
        {
            route: "/account/password/forgot",
            methods:['POST'],
            isSessionCheckNeeded:false
        },
        {
            route: "/account/password/forgot_done",
            methods:['POST'],
            isSessionCheckNeeded:false
        },
    ],
    noSessionTokenNeededRoutesCheck: function(originalUrl,method) {
        for (i = 0; i < this.routes.length; i++) {
            if (this.routes[i].route == originalUrl.split('?')[0].split(':')[0].toLowerCase() && !this.routes[i].isSessionCheckNeeded && this.routes[i].methods.indexOf(method) > -1) {
                return true;
            }
        }
        return false;
    },
    /**
     * Permitted App Hosts, and activation settings
     */
    appHosts:[],
    //check if host origin acceptable
    appHostsCheck: function(host) {
        console.log(host)
        for (i = 0; i < this.appHosts.length; i++) {
            if ((this.appHosts[i].host!="" ? this.appHosts[i].host : undefined) == host) {
                return true;
            }
        }
        return false;
    },
    //get app name by refereer
    appNameByOrigin: function(host) {
        for (i = 0; i < this.appHosts.length; i++) {
            if ((this.appHosts[i].host!="" ? this.appHosts[i].host : undefined) == host) {
                return this.appHosts[i]
            }
        }
        return "None App";
    },
    //check if activation needed for app
    appHostsActivationCheck: function(host,isAccountActivated) {
        for (i = 0; i < this.appHosts.length; i++) {
            if ((this.appHosts[i].host == host && !this.appHosts[i].needAccountActivation) || (this.appHosts[i].host == host && this.appHosts[i].needAccountActivation && isAccountActivated)) {
                return true;
            }
        }
        return false;
    },
    /**
     * Headers
     */
    headers:{
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE'
    },
    /**
     * General Functions
     */
    getClientIp: function(req) {
        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null);
    },
    getRandomHash:function() {
        var passGen = crypto.randomBytes(20).toString('hex');
        var newHash = bcrypt.hashSync(passGen, bcrypt.genSaltSync(10), null);
        return newHash
    }

};
