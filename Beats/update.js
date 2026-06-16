const express = require("express");
const multer = require("multer");
const axios = require("axios");

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });
const router = express.Router();

router.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no file" });
    if (!req.file.mimetype.startsWith("audio"))
      return res.status(400).json({ error: "invalid file type" });
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;

    await axios.put(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${process.env.R2_BUCKET}/objects/${fileName}`,
      req.file.buffer,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": req.file.mimetype,
        },
      },
    );

    res.json({
      success: true,
      fileName,
    });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json(err.response?.data || err);
  }
});

module.exports = router;
