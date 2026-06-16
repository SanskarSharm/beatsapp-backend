const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const dbFile = path.join(__dirname, "beats.db");
const schemaFile = path.join(__dirname, "..", "Database", "schema.sql");

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) return console.error("Failed to open DB", err);
});

function init() {
  try {
    const exists = fs.existsSync(dbFile);
    if (exists) {
      console.log("Database file exists — skipping schema initialization.");
      return;
    }
    const schema = fs.readFileSync(schemaFile, "utf8");
    db.exec(schema, (err) => {
      if (err) console.error("DB init error:", err);
      else console.log("Database created and initialized.");
    });
  } catch (err) {
    console.error("Could not read schema file:", err.message || err);
  }
}

module.exports = { db, init };
