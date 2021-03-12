/**
 * General App Config by model
 */
module.exports = {
    db:{
        UniqueVaiolation:{
            lang_12:{
                errors:[{
                    "status": "500",
                    "source": { "pointer": "/docs/errors/db/UniqueVaiolation" },
                    "title":  "Entity Already Exists",
                    "detail": ""
                }]
            },
            lang_13:{
                errors:[{
                    "status": "500",
                    "source": { "pointer": "/docs/errors/db/UniqueVaiolation" },
                    "title":  "יישות כבר קיימת",
                    "detail": ""
                }]
            }
        },
    },
    system:{
        GeneralSystemError:{
            lang_12:{
                errors:[{
                    "status": "500",
                    "source": { "pointer": "/docs/errors/system/ContactAdmin" },
                    "title":  "General Error, Please Contact System Administrator",
                    "detail": ""
                }]
            },
            lang_13:{
                errors:[{
                    "status": "500",
                    "source": { "pointer": "/docs/errors/db/GeneralError" },
                    "title":  "שגיאה כללית במסד נתונים",
                    "detail": ""
                }]
            }
        },
        CSRFError:{
            lang_12:{
                errors:[{
                    "status": "403",
                    "source": { "pointer": "/docs/errors/system/CSRF" },
                    "title":  "CSRF Protection",
                    "detail": ""
                }]
            },
            lang_13:{
                errors:[{
                    "status": "403",
                    "source": { "pointer": "/docs/errors/system/CSRF" },
                    "title":  "הגנת CSRF",
                    "detail": ""
                }]
            }
        },
    },
    user:{
        NotActivatedError:{
            lang_12:{
                errors:[{
                    "status": "403",
                    "source": { "pointer": "/docs/errors/user/NotActivated" },
                    "title":  "Account Not Activated",
                    "detail": "Please View Your Email To Activate."
                }]
            },
            lang_13:{
                errors:[{
                    "status": "403",
                    "source": { "pointer": "/docs/errors/user/NotActivated" },
                    "title":  "חשבון לא נופעל",
                    "detail": "בבקשה גש לחשבונך כדי להפעיל."
                }]
            }
        },
        AlreadyActivated:{
            lang_12:{
                errors:[{
                    "status": "403",
                    "source": { "pointer": "/docs/errors/user/AlreadyActivated" },
                    "title":  "Account Already Activated",
                    "detail": "Account Already Activated."
                }]
            },
            lang_13:{
                errors:[{
                    "status": "403",
                    "source": { "pointer": "/docs/errors/user/AlreadyActivated" },
                    "title":  "חשבונך הופעל כבר",
                    "detail": "חשבונך הופעל כבר."
                }]
            }
        },
        AlreadyDeletedError:{
            lang_12:{
                errors:[{
                    "status": "403",
                    "source": { "pointer": "/docs/errors/user/AlreadyDeletedError" },
                    "title":  "Account Deleted Already",
                    "detail": "Account Deleted Already"
                }]
            },
            lang_13:{
                errors:[{
                    "status": "403",
                    "source": { "pointer": "/docs/errors/user/AlreadyDeletedError" },
                    "title":  "חשבונך כבר נמחק",
                    "detail": "חשבונך כבר נמחק"
                }]
            }
        },
        AlreadyLoggedIn:{
            lang_12:{
                errors:[{
                    "status": "406",
                    "source": { "pointer": "/docs/errors/user/AlreadyLoggedIn" },
                    "title":  "Already Logged In",
                    "detail": "Already Logged In."
                }]
            },
            lang_13:{
                errors:[{
                    "status": "406",
                    "source": { "pointer": "/docs/errors/user/AlreadyLoggedIn" },
                    "title":  "הנך מחובר כבר",
                    "detail": "הנך מחובר כבר."
                }]
            }
        },
    },
    getErrorByLang:function(model,errorId,langId,res,err) {
        let error=this[model][errorId]["lang_" + langId]
        if (err) {
            error.errors[0].detail=String(err)
        }
        return res.status(error.errors[0].status).send(error);
    },
    getSystemErrorByLang:function(err,langId,res) {
        switch (err.name) {
            case "SequelizeDatabaseError":
                return this.getErrorByLang('system','GeneralSystemError',langId,res,err)
                break;
            case "SequelizeUniqueConstraintError":
                return this.getErrorByLang('db','UniqueVaiolation',langId,res,err)
                break;
            default:
                return this.getErrorByLang('system','GeneralSystemError',langId,res,err)
        }
    }
};