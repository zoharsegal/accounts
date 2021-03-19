const appConfig = require("../environment/app.config");
const appErrorsConfig = require("../environment/app.errors");
const db = require("../models");
const organization = db.organizations;
const Op = db.Sequelize.Op;

/**
 * Private functions
 *
 */



/**
 * CREATE
 *
 */

exports.create = (req, res) => {
    const createData = {
        accountId: req.userId,
        organizationName: req.body.organizationName || null,
        address: req.body.address || null,
        phone: req.body.phone || null,
    };
    organization.create(createData)
        .then(data => {
            var jsonRes={
                data:{
                    id:data.id,
                    type: "organization",
                    attributes: createData
                }
            }
            res.status(201).send(jsonRes)
        })
        .catch(err => {
            appErrorsConfig.getSystemError(err,res)
        });
};

/**
 * UPDATE
 *
 */

exports.update = (req, res) => {
    const updateData = {
        organizationName: req.body.organizationName || null,
        address: req.body.address || null,
        phone: req.body.phone || null,
    };
    organization.update(updateData, {
        where: {accountId: req.userId,id: req.params.id,isDeleted: false},
    })
        .then((result) => {
            if (result[0]>0) {
                var jsonRes={
                    data:{
                        id:req.userId,
                        type: "account",
                        attributes: updateData
                    }
                }
                return res.status(200).send(jsonRes);
            } else {
                return res.status(409).send({});
            }

        }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });
};

/**
 * DELETE Multi
 *
 */

exports.delete = (req, res) => {
    var ids
    try {
        ids=JSON.parse(req.body.ids)
    } catch(err) {
        return appErrorsConfig.getSystemError("",res)
    }
    if (ids.some(isNaN)) {
        return appErrorsConfig.getSystemError("",res)
    }
    const updateData = {
        isDeleted: true,
    };
    organization.update(updateData, {
        where: {accountId: req.userId, id: ids,isDeleted: false},
    })
        .then((result) => {
            if (result[0]>0) {
                return res.status(204).send({});
            } else {
                return res.status(409).send({});
            }

        }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });
};

/**
 * GET Multi/Individual
 *
 */

exports.get = (req, res) => {
    var id = req.params.id;
    var whereClause={accountId: req.userId,isDeleted: false}
    if (id) {
        whereClause={accountId: req.userId, id:id,isDeleted: false}
    }
    organization.findAll({
        where: whereClause,
        attributes: ['id','organizationName','address','phone']
    }).then(function(data) {
        var jsonResult={data:[]}
        for (var i = 0; i < data.length; i++) {
            jsonResult.data.push({
                id:data[i].id,
                type:"organization",
                attributes:data[i],

            })
        }
        jsonResult.data.forEach(function(v){ delete v.attributes.id });
        return res.status(200).send(jsonResult)
    }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });
};
