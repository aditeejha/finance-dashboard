require("dotenv").config();
const app = require("./app");
const sequelize = require("./config/database");
const { User, Transaction } = require("./models"); // ensure associations are loaded

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log("✅ Database connected successfully.");

    // Sync models — creates tables if they don't exist
    // Use { force: true } only to drop and recreate tables during development
    await sequelize.sync({ alter: true });
    console.log("✅ Database models synced.");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
