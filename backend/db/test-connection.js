const { Client } = require("pg");
require("dotenv").config();

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: "postgres", // Try connecting to default database
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  };

  console.log("Testing connection with:");
  console.log("Host:", config.host);
  console.log("Port:", config.port);
  console.log("Database:", config.database);
  console.log("User:", config.user);
  console.log("Password length:", config.password.length);
  console.log("\nAttempting connection...\n");

  const client = new Client(config);

  try {
    await client.connect();
    console.log("✅ Connection successful!");

    const result = await client.query("SELECT version()");
    console.log("\nPostgreSQL Version:");
    console.log(result.rows[0].version);

    // Check for scholardemon database
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'scholardemon'"
    );

    if (dbCheck.rows.length > 0) {
      console.log("\n✅ Database 'scholardemon' exists!");
    } else {
      console.log("\n⚠️  Database 'scholardemon' does not exist yet.");
    }

    await client.end();
  } catch (error) {
    console.error("❌ Connection failed!");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("\nPossible solutions:");
    console.log("1. Check if PostgreSQL service is running");
    console.log(
      "2. Verify password in .env file (current length:",
      config.password.length,
      ")"
    );
    console.log("3. Check pg_hba.conf authentication method");
    console.log("4. Try connecting with pgAdmin4 using the same credentials");
    process.exit(1);
  }
}

testConnection();
