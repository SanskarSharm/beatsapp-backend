const express = require("express");
const router = express.Router();
const { db } = require("../db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

router.post("/", (req, res) => {
  const { name, mobile, email, password, address } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "name,email,password required" });
  bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
    if (err) return res.status(500).json({ error: err.message });
    const stmt = `INSERT INTO users (name, mobile, email, password, address) VALUES (?, ?, ?, ?, ?)`;
    db.run(stmt, [name, mobile, email, hash, address], function (err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true, id: this.lastID });
    });
  });
});

router.get("/", (req, res) => {
  db.all(
    "SELECT id, name, mobile, email, address, beats_buy, user_created_date FROM users",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ items: rows });
    },
  );
});

module.exports = router;
