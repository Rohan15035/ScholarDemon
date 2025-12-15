const { Pool } = require("pg");
require("dotenv").config();

async function createDatabase() {
  // Connect to the default 'postgres' database first
  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: "postgres", // Connect to default database
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  });

  try {
    console.log("Checking if database exists...");

    // Check if database exists
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || "scholardemon"]
    );

    if (result.rows.length === 0) {
      console.log(`Creating database ${process.env.DB_NAME}...`);
      await pool.query(
        `CREATE DATABASE ${process.env.DB_NAME || "scholardemon"}`
      );
      console.log("Database created successfully!");
    } else {
      console.log("Database already exists.");
    }
  } catch (error) {
    console.error("Error creating database:", error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  createDatabase().catch(console.error);
}

module.exports = createDatabase;
