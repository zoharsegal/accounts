
module.exports = (sequelize, Sequelize) => {
    const Apps = sequelize.define("apps", {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        appName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        ip: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                isIp: true
            },
        },
        host: {
            type: Sequelize.STRING,
            allowNull: false,
            validate: {
                isUrl: true
            },
        },
        needAccountActivation: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
    }, {
        schema: 'accounts'
    });
    return Apps;
};

