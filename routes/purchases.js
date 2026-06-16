const express = require("express");
const router = express.Router();
const { db } = require("../db");

// Buy a beat: creates purchase, marks beat sold, updates user stats
router.post("/buy", (req, res) => {
  const { user_id, beat_id, purchase_price } = req.body;
  if (!user_id || !beat_id)
    return res.status(400).json({ error: "user_id and beat_id required" });

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const insert = `INSERT INTO beat_purchases (user_id, beat_id, purchase_price) VALUES (?, ?, ?)`;
    db.run(insert, [user_id, beat_id, purchase_price || null], function (err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }

      const purchaseId = this.lastID;
      db.run(
        "UPDATE beats SET selling_status = 'sold' WHERE id = ?",
        [beat_id],
        (err2) => {
          if (err2) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: err2.message });
          }

          db.run(
            "UPDATE users SET beats_buy = COALESCE(beats_buy,0) + 1, last_purchase_date = datetime('now') WHERE id = ?",
            [user_id],
            (err3) => {
              if (err3) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err3.message });
              }

              db.run("COMMIT");
              res.json({ success: true, purchaseId });
            },
          );
        },
      );
    });
  });
});

// list purchases with joins
router.get("/", (req, res) => {
  const q = `SELECT p.id, p.purchase_price, p.purchased_at, u.id as user_id, u.name as user_name, b.id as beat_id, b.beat_name, a.artist_name FROM beat_purchases p JOIN users u ON p.user_id = u.id JOIN beats b ON p.beat_id = b.id LEFT JOIN artists a ON b.artist_id = a.id ORDER BY p.purchased_at DESC`;
  db.all(q, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ items: rows });
  });
});

module.exports = router;
