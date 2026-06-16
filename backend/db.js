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
    const schema = fs.readFileSync(schemaFile, "utf8");
    const seedFile = path.join(__dirname, "..", "Database", "seed.sql");

    function applySchemaAndSeed() {
      db.exec(schema, (err) => {
        if (err) {
          console.error("DB init error:", err);
          return;
        }
        console.log("Database created and initialized.");
        try {
          if (fs.existsSync(seedFile)) {
            const seed = fs.readFileSync(seedFile, "utf8");
            if (seed && seed.trim()) {
              db.exec(seed, (err2) => {
                if (err2) console.error("DB seed error:", err2.message || err2);
                else console.log("Database seeded from seed.sql");
              });
            }
          }
        } catch (e) {
          console.error("Could not apply seed file:", e.message || e);
        }
      });
    }

    if (!exists) {
      // No DB file — apply schema (and seed)
      applySchemaAndSeed();
      return;
    }

    // DB file exists — ensure required tables exist, otherwise apply schema
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'",
      (err, row) => {
        if (err) {
          console.error("Error checking DB schema:", err.message || err);
          return;
        }
        if (!row) {
          console.log(
            "Database exists but missing tables — initializing schema.",
          );
          applySchemaAndSeed();
        } else {
          console.log("Database file exists and appears initialized.");
        }
      },
    );
  } catch (err) {
    console.error("Could not read schema file:", err.message || err);
  }
}

module.exports = { db, init };
