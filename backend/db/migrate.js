const fs = require("fs");
const path = require("path");
const { pool } = require("./config");

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("Starting database migration...");

    const schemaSQL = fs.readFileSync(
      path.join(__dirname, "schema.sql"),
      "utf8"
    );

    await client.query(schemaSQL);

    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  migrate().catch(console.error);
}

module.exports = migrate;
