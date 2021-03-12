/**
 * General App Config
 */
module.exports = {
    appName: 'Accounts',
    appDefaultLangId: 12,
    isSSL: true,
    appDomain: 'domain.com',
    appPort: 82,
    appUrl: '/',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpIsSSL: true,
    smtpUserName: "zesegal1",
    smtpPassword: "064219569",
    allowedToGetCSRFIps:['::1'],
    skipCSRFProtectionRoutes:['/user/ping'],
    jwtSecret:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyTmFtZSI6Inpva3JpIiwiaWF0IjoxNjE1NTM5NTg4LCJleHAiOjE2MTU1NDMxODh9.eKqFetrcIJjJLGmnREfik8IfUmqAI31aUvfuyDovlvI",
    /**
     * Session params
     */
    sessionMaxAge: 30 * 24 * 60 * 60 * 1000, // 30 * 24 * 60 * 60 * 1000 -30 days
    noSessionTokenNeededRoutes: [
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
    ],
    noSessionTokenNeededRoutesCheck: function(originalUrl,method) {
        for (i = 0; i < this.noSessionTokenNeededRoutes.length; i++) {
            if (this.noSessionTokenNeededRoutes[i].route == originalUrl.split('?')[0].toLowerCase() && this.noSessionTokenNeededRoutes[i].methods.indexOf(method) > -1) {
                return true;
            }
        }
        return false;
    },
    routes: [
        {
            route: "/user",
            methods:['POST','GET','DELETE']
        },
        {
            route: "/user/logout",
            methods:['POST']
        },
        {
            route: "/user/login",
            methods:['POST']
        },
        {
            route: "/user/ping",
            methods:['GET']
        },
        {
            route: "/user/activate",
            methods:['GET']
        }
    ],
    routeExistsCheck: function(originalUrl,method) {
        for (i = 0; i < this.routes.length; i++) {
            if (this.routes[i].route == originalUrl.split('?')[0].toLowerCase() && this.routes[i].methods.indexOf(method) > -1) {
                return true;
            }
        }
        return false;
    },
    /**
     * Permitted App Hosts, and activation settings
     */
    appHosts:[
        {
            appId:"app1",
            appName:"App1",
            host:'http://localhost',
            needAccountActivation:false,

        },
        {
            appId:"account",
            appName:"Account",
            host:undefined, /* Current Host */
            needAccountActivation:true,

        },
    ],
    //check if host origin acceptable
    appHostsCheck: function(host) {
        for (i = 0; i < this.appHosts.length; i++) {
            if (this.appHosts[i].host == host) {
                return true;
            }
        }
        return false;
    },
    //get app name by refereer
    appNameByOrigin: function(host) {
        for (i = 0; i < this.appHosts.length; i++) {
            if (this.appHosts[i].host == host) {
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

};