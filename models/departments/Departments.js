
module.exports = (sequelize, Sequelize,company, account) => {
    const Departments = sequelize.define("departments", {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        departmentName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        isDeleted: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        address: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        phone: {
            type: Sequelize.STRING,
            allowNull: false,
        },

    }, {
        schema: 'accounts'
    });
    Departments.belongsTo(account, {
        foreignKey: {
            allowNull: false
        }
    });
    Departments.belongsTo(company, {
        foreignKey: {
            allowNull: false
        }
    });
    return Departments;
};

