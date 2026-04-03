const User = require("./User");
const Transaction = require("./Transaction");

// A user can create many transactions
User.hasMany(Transaction, { foreignKey: "createdBy", as: "transactions" });
Transaction.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

module.exports = { User, Transaction };
