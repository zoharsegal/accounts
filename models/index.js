const dbConfig = require("../environment/db.config");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    operatorsAliases: 0,

    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;



db.countries = require("./Countries.js")(sequelize, Sequelize);
db.apps = require("./Apps.js")(sequelize, Sequelize);
db.permissions = require("./Permissons.js")(sequelize, Sequelize);
db.accounts = require("./accounts/Account.js")(sequelize, Sequelize);
db.permission_app_accounts = require("./PermissionAppAccounts.js")(sequelize, Sequelize);
db.organizations = require("./organizations/Organizations.js")(sequelize, Sequelize);
db.companies = require("./companies/Companies.js")(sequelize, Sequelize);
db.departments = require("./departments/Departments.js")(sequelize, Sequelize,db.companies,db.accounts);
db.departments_sub = require("./department_sub/DepartmentSubs.js")(sequelize, Sequelize);
db.sessions = require("./accounts/Session.js")(sequelize, Sequelize);


/*
 * Accounts Foreigs Kes
 */
db.accounts.belongsTo(db.organizations,{ constraints: false });
db.accounts.belongsTo(db.companies,{ constraints: false });
db.accounts.belongsTo(db.departments,{ constraints: false });
db.accounts.belongsTo(db.departments_sub,{ constraints: false });
db.accounts.belongsTo(db.apps,{ constraints: false });
db.accounts.belongsTo(db.accounts, { foreignKey: 'affiliateId',constraints: false });
db.accounts.belongsTo(db.accounts, { foreignKey: 'ownerAccountId',constraints: false });
db.accounts.belongsTo(db.countries,{ constraints: false });
db.accounts.hasMany(db.permission_app_accounts, {constraints: false});


/*
 * Session Foreigs Kes
 */
db.sessions.belongsTo(db.accounts, {
    foreignKey: 'userId',
    allowNull: false,
    constraints: false
});

/*
 * Apps Foreigs Kes
 */
db.apps.hasMany(db.permissions, {constraints: false});

/*
 * Permissions Foreigs Kes
 */
db.permissions.belongsTo(db.apps, {
    foreignKey: {
        allowNull: false
    },
    constraints: false
});
db.permissions.hasMany(db.permission_app_accounts, {constraints: false});


/*
 * Permission App Accounts Foreigs Kes
 */

db.permission_app_accounts.belongsTo(db.accounts, {
    foreignKey: {
        allowNull: false
    },
    constraints: false
});
db.permission_app_accounts.belongsTo(db.permissions, {
    foreignKey: {
        allowNull: false
    },
    constraints: false
});

/*
 * Organizations Foreigs Kes
 */

db.organizations.belongsTo(db.accounts, {
    foreignKey: {
        allowNull: false
    },
    constraints: false
});

/*
 * Companies Foreigs Kes
 */

db.companies.belongsTo(db.organizations, {
    foreignKey: {
        allowNull: false
    },
    constraints: false
});
db.companies.belongsTo(db.accounts, {
    foreignKey: {
        allowNull: false
    },
    constraints: false
});

/*
 * Companies Foreigs Kes
 */

db.departments.belongsTo(db.companies, {
    foreignKey: {
        allowNull: false
    },
    constraints: false
});
db.departments.belongsTo(db.accounts, {
    foreignKey: {
        allowNull: false
    },
    constraints: false
});

/*
 * Department_subs Foreigs Kes
 */

db.departments_sub.belongsTo(db.accounts, {
    foreignKey: {
        allowNull: false
    },
    constraints: false
});
db.departments_sub.belongsTo(db.departments, {
    foreignKey: {
        allowNull: false
    },
    constraints: false
});




module.exports = db;