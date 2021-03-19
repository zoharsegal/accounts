const appConfig = require("../environment/app.config");
const appErrorsConfig = require("../environment/app.errors");
const db = require("../models");
const department_sub = db.departments_sub;
const department = db.departments;
const Op = db.Sequelize.Op;

/**
 * Private functions
 *
 */



/**
 * CREATE
 *
 */

exports.create =  async function(req, res) {
    var data=await department.findOne({
        where: {
            id: req.body.departmentId || null,
            isDeleted: false,
            accountId: req.userId
        },
        attributes: ['id']
    })
    if (!data) {
        return res.status(401).send({})
    }
    const createData = {
        accountId: req.userId,
        departmentSubName: req.body.departmentSubName || null,
        address: req.body.address || null,
        phone: req.body.phone || null,
        departmentId: data.id,
    };
    department_sub.create(createData)
        .then(data => {
            var jsonRes={
                data:{
                    id:data.id,
                    type: "department_sub",
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

exports.update = async function(req, res) {
    var data=await department.findOne({
        where: {
            id: req.body.departmentId || null,
            isDeleted: false,
            accountId: req.userId
        },
        attributes: ['id']
    })
    if (!data) {
        return res.status(401).send({})
    }
    const updateData = {
        departmentSubName: req.body.departmentSubName || null,
        address: req.body.address || null,
        phone: req.body.phone || null,
        departmentId: data.id,
    };
    department_sub.update(updateData, {
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
    department_sub.update(updateData, {
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
    department_sub.findAll({
        where: whereClause,
        attributes: ['id','departmentSubName','address','phone']
    }).then(function(data) {
        var jsonResult={data:[]}
        for (var i = 0; i < data.length; i++) {
            jsonResult.data.push({
                id:data[i].id,
                type:"department_sub",
                attributes:data[i],

            })
        }
        jsonResult.data.forEach(function(v){ delete v.attributes.id });
        return res.status(200).send(jsonResult)
    }).catch(err => {
        return appErrorsConfig.getSystemError(err,res)
    });
};
