require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const beatsRouter = require("./routes/beats");
const usersRouter = require("./routes/users");
const artistsRouter = require("./routes/artists");
const beatsMetaRouter = require("./routes/beatsMeta");
const purchasesRouter = require("./routes/purchases");
const db = require("./db");

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan(process.env.LOG_FORMAT || "combined"));

// serve frontend statically so app can be deployed from one server
app.use(express.static(path.join(__dirname, "..", "frontend")));

// initialize DB/schema
db.init();

// API routes for metadata
app.use("/api/users", usersRouter);
app.use("/api/artists", artistsRouter);
app.use("/api/beats", beatsMetaRouter);
app.use("/api/purchases", purchasesRouter);

// basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal error" });
});

app.get("/", (req, res) => res.send("Server Running"));

app.use("/beats", beatsRouter);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
