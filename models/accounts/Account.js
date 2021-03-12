const bcrypt = require("bcrypt");

module.exports = (sequelize, Sequelize) => {
    const Account = sequelize.define("accounts_new", {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        userName: {
            type: Sequelize.STRING,
            validate: {
                is: /^[a-z0-9]+$/i
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
        password: {
            type: Sequelize.STRING,
            validate: {
                is: /^[a-z0-9]+$/i,
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

    }, {
        schema: 'accounts',
        hooks: {
            beforeCreate: (user) => {
                var password=user.password
                const saltRounds = 10;
                user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null);
            },
        }
    });

    return Account;
};

