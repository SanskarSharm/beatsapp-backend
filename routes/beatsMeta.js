const express = require("express");
const router = express.Router();
const { db } = require("../db");

// create a beat record; can create artist on the fly via artist_name
router.post("/create", (req, res) => {
  const b = req.body || {};
  const fields = [
    "beat_name",
    "beat_type",
    "price",
    "genre",
    "bpm",
    "description",
    "audio_url",
    "cover_image_url",
    "banner_image_url",
    "duration",
    "track_type",
    "mood",
    "selling_status",
    "status",
  ];

  function insertBeat(artistId) {
    const values = fields.map((f) => b[f] || null);
    const stmt = `INSERT INTO beats (artist_id, ${fields.join(", ")}) VALUES (${["?"].concat(fields.map(() => "?")).join(", ")})`;
    const params = [artistId].concat(values);
    db.run(stmt, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    });
  }

  if (b.artist_id) return insertBeat(b.artist_id);

  if (b.artist_name) {
    db.run(
      "INSERT INTO artists (artist_name, mobile, email, address) VALUES (?, ?, ?, ?)",
      [
        b.artist_name,
        b.artist_mobile || null,
        b.artist_email || null,
        b.artist_address || null,
      ],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        insertBeat(this.lastID);
      },
    );
    return;
  }

  return res.status(400).json({ error: "artist_id or artist_name required" });
});

// list beats with artist name
router.get("/", (req, res) => {
  const q = `SELECT b.id, b.beat_name, b.beat_type, b.price, b.genre, b.bpm, b.description, b.audio_url, b.cover_image_url, b.banner_image_url, b.duration, b.track_type, b.mood, b.selling_status, b.status, b.created_at, b.updated_at, a.artist_name FROM beats b LEFT JOIN artists a ON b.artist_id = a.id ORDER BY b.created_at DESC`;
  db.all(q, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ items: rows });
  });
});

module.exports = router;
