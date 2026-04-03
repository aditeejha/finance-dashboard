require("dotenv").config();
const sequelize = require("./database");
const { User, Transaction } = require("../models");

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("Connected. Seeding...");

    // --- Create Users ---
    const [admin] = await User.findOrCreate({
      where: { email: "admin@finance.com" },
      defaults: {
        name: "Admin User",
        email: "admin@finance.com",
        password: "admin123",
        role: "admin",
        status: "active",
      },
    });

    const [analyst] = await User.findOrCreate({
      where: { email: "analyst@finance.com" },
      defaults: {
        name: "Analyst User",
        email: "analyst@finance.com",
        password: "analyst123",
        role: "analyst",
        status: "active",
      },
    });

    await User.findOrCreate({
      where: { email: "viewer@finance.com" },
      defaults: {
        name: "Viewer User",
        email: "viewer@finance.com",
        password: "viewer123",
        role: "viewer",
        status: "active",
      },
    });

    console.log("✅ Users seeded.");

    // --- Create Sample Transactions ---
    const transactions = [
      { amount: 50000, type: "income",  category: "Salary",      date: "2025-01-05", notes: "Monthly salary" },
      { amount: 12000, type: "expense", category: "Rent",         date: "2025-01-10", notes: "Office rent" },
      { amount: 3500,  type: "expense", category: "Utilities",    date: "2025-01-15", notes: "Electricity bill" },
      { amount: 8000,  type: "income",  category: "Freelance",    date: "2025-02-03", notes: "Consulting project" },
      { amount: 2200,  type: "expense", category: "Food",         date: "2025-02-12", notes: "Team lunch" },
      { amount: 50000, type: "income",  category: "Salary",       date: "2025-02-05", notes: "Monthly salary" },
      { amount: 5000,  type: "expense", category: "Travel",       date: "2025-02-20", notes: "Client visit" },
      { amount: 50000, type: "income",  category: "Salary",       date: "2025-03-05", notes: "Monthly salary" },
      { amount: 12000, type: "expense", category: "Rent",         date: "2025-03-10", notes: "Office rent" },
      { amount: 15000, type: "income",  category: "Freelance",    date: "2025-03-18", notes: "Website project" },
      { amount: 4000,  type: "expense", category: "Software",     date: "2025-03-22", notes: "Subscriptions" },
      { amount: 50000, type: "income",  category: "Salary",       date: "2025-04-05", notes: "Monthly salary" },
      { amount: 12000, type: "expense", category: "Rent",         date: "2025-04-10", notes: "Office rent" },
      { amount: 1800,  type: "expense", category: "Utilities",    date: "2025-04-14", notes: "Internet bill" },
    ];

    for (const t of transactions) {
      await Transaction.findOrCreate({
        where: { amount: t.amount, date: t.date, category: t.category },
        defaults: { ...t, createdBy: admin.id },
      });
    }

    console.log("✅ Transactions seeded.");
    console.log("\n--- Test Credentials ---");
    console.log("Admin    → admin@finance.com    / admin123");
    console.log("Analyst  → analyst@finance.com  / analyst123");
    console.log("Viewer   → viewer@finance.com   / viewer123");
    console.log("------------------------\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

seed();
