
module.exports = (sequelize, Sequelize) => {
    const Permissions = sequelize.define("permissions", {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        permissionName: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
        permissionDefaultParams: {
            type: Sequelize.JSON,
            allowNull: false,
        },

    }, {
        schema: 'accounts'
    });
    return Permissions;
};

