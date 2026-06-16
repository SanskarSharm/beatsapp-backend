const express = require("express");
const router = express.Router();
const { db } = require("../db");

router.post("/", (req, res) => {
  const { artist_name, mobile, email, address } = req.body;
  const stmt = `INSERT INTO artists (artist_name, mobile, email, address) VALUES (?, ?, ?, ?)`;
  db.run(stmt, [artist_name, mobile, email, address], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

router.get("/", (req, res) => {
  db.all(
    "SELECT id, artist_name, mobile, email, address, created_at FROM artists",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ items: rows });
    },
  );
});

module.exports = router;
