const bcrypt = require("bcrypt");

module.exports = (sequelize, Sequelize) => {
    const Account = sequelize.define("accounts", {
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
            unique: true
        },
        langId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 12
        },
        isBanned: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        banReason: {
            type: Sequelize.STRING,
        },
        isDeleted: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isActivated: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isAdmin: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        firstName: {
            type: Sequelize.STRING,
            validate: {
                isAlpha: true,
            },
            allowNull: false,
        },
        lastName: {
            type: Sequelize.STRING,
            validate: {
                isAlpha: true,
            },
            allowNull: false,
        },
        activateHash: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        newPasswordHash: {
            type: Sequelize.STRING,
        },
        newPasswordHashCreatedAt: {
            type: Sequelize.DATE,
        },
        password: {
            type: Sequelize.STRING,
            validate: {
                is: /(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/i,
                isPasswordConfirmed(value) {
                    if (value != this.password_confirmation) {
                        throw new Error('Password Not Matched');
                    }
                }
            },
            allowNull: false
        },
        password_confirmation: {
            type: Sequelize.VIRTUAL
        },
        email: {
            type: Sequelize.STRING,
            validate: {
                isEmail: true
            },
            allowNull: false,
            unique: true
        },
        lastIp: {
            type: Sequelize.STRING,
            validate: {
                isIP: true
            },
            allowNull: false
        },
        state: {
            type: Sequelize.STRING,
            allowNull: true
        },
        address: {
            type: Sequelize.STRING,
            allowNull: true
        },
        phone: {
            type: Sequelize.STRING,
            allowNull: true
        },
    }, {
        schema: 'accounts',
        hooks: {
            beforeCreate: (user) => {
                var password=user.password
                const saltRounds = 10;
                user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null);
            },
            beforeUpdate: (user) => {
                var password=user.password
                if (password) {
                    const saltRounds = 10;
                    user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null);
                }
            },
        }
    });


    return Account;
};

