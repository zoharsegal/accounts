/**
 * General App Config by model
 */
module.exports = {
    db:{
        UniqueVaiolation:{
            errors:[{
                "status": "500",
                "source": { "pointer": "/docs/errors/db/UniqueVaiolation" },
                "title":  "UniqueVaiolation",
                "detail": ""
            }]
        },
        ValidationError:{
            errors:[{
                "status": "500",
                "source": { "pointer": "/docs/errors/db/ValidationError" },
                "title":  "ValidationError",
                "detail": ""
            }]
        },
        ForeinKeyViolation:{
            errors:[{
                "status": "500",
                "source": { "pointer": "/docs/errors/db/ForeinKeyViolation" },
                "title":  "ForeinKeyViolation",
                "detail": ""
            }]
        },
    },
    system:{
        GeneralSystemError:{
            errors:[{
                "status": "500",
                "source": { "pointer": "/docs/errors/system/ContactAdmin" },
                "title":  "GeneralSystemError",
                "detail": ""
            }]
        },
        CSRFError:{
            errors:[{
                "status": "403",
                "source": { "pointer": "/docs/errors/system/CSRF" },
                "title":  "CSRFError",
                "detail": ""
            }]
        },
    },
    user:{
        NotActivatedError:{
            errors:[{
                "status": "403",
                "source": { "pointer": "/docs/errors/user/NotActivated" },
                "title":  "NotActivatedError",
                "detail": ""
            }]
        },
        AlreadyActivated:{
            errors:[{
                "status": "403",
                "source": { "pointer": "/docs/errors/user/AlreadyActivated" },
                "title":  "AlreadyActivated",
                "detail": ""
            }]
        },
        AlreadyDeletedError:{
            errors:[{
                "status": "403",
                "source": { "pointer": "/docs/errors/user/AlreadyDeletedError" },
                "title":  "AlreadyDeletedError",
                "detail": ""
            }]
        },
        AlreadyLoggedIn:{
            errors:[{
                "status": "406",
                "source": { "pointer": "/docs/errors/user/AlreadyLoggedIn" },
                "title":  "AlreadyLoggedIn",
                "detail": ""
            }]
        },
    },
    getError:function(model,errorId,res,err) {
        let error=this[model][errorId]
        if (err) {
            error.errors[0].detail=String(err)
        }
        return res.status(error.errors[0].status).send(error);
    },
    getSystemError:function(err,res) {
        switch (err.name) {
            case "SequelizeDatabaseError":
                return this.getError('system','GeneralSystemError',res,err)
                break;
            case "SequelizeUniqueConstraintError":
                return this.getError('db','UniqueVaiolation',res,err)
                break;
            case "SequelizeValidationError":
                return this.getError('db','ValidationError',res,err)
                break;
            case "SequelizeForeignKeyConstraintError":
                return this.getError('db','ForeinKeyViolation',res,err)
                break;
            default:
                return this.getError('system','GeneralSystemError',res,err)
        }
    }
};