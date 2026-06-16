const express = require("express");

const uploadRouter = require("../Beats/upload");
const updateRouter = require("../Beats/update");
const uploadImageRouter = require("../Beats/upload-image");
const listObjects = require("../Beats/list");
const getObject = require("../Beats/getobject");
const deleteObject = require("../Beats/delete");

const router = express.Router();

// Mount upload/update sub-routers
router.use("/", uploadRouter);
router.use("/", updateRouter);
router.use("/", uploadImageRouter);

// List objects with optional pagination
router.get("/list", async (req, res) => {
  try {
    const opts = {
      maxKeys: req.query.maxKeys,
      continuationToken: req.query.continuationToken,
    };
    const data = await listObjects(opts);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err });
  }
});

// Get object (streams binary)
router.get("/object/:key", async (req, res) => {
  try {
    const data = await getObject(req.params.key);
    if (data && data.buffer) {
      res.setHeader(
        "Content-Type",
        data.contentType || "application/octet-stream",
      );
      return res.send(data.buffer);
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err });
  }
});

// Delete object
router.delete("/object/:key", async (req, res) => {
  try {
    const data = await deleteObject(req.params.key);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;
