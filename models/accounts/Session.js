
module.exports = (sequelize, Sequelize) => {
    const Session = sequelize.define("sessions", {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        userName: {
            type: Sequelize.STRING,
            validate: {
                is: /^[a-z0-9]+$/i
            },
            allowNull: false,
        },
        sessionId: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        lastIp: {
            type: Sequelize.STRING,
            validate: {
                isIP: true
            },
            allowNull: false
        },

    }, {
        schema: 'accounts'
    });

    return Session;
};

