
module.exports = (sequelize, Sequelize) => {
    const Session = sequelize.define("sessions", {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        userName: {
            type: Sequelize.STRING,
            validate: {
                is: /^[a-z0-9_-]+$/i
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

