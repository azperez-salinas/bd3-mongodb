const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const moviesRoutes = require("./routes/movies");
const reviewsRoutes = require("./routes/reviews");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/movies", moviesRoutes);
app.use("/api", reviewsRoutes);

app.get("/api/status", (_req, res) => {
  const isConnected = mongoose.connection.readyState === 1;

  res.json({
    ok: true,
    service: "umdb-template-backend",
    mongo: {
      connected: isConnected,
      readyState: mongoose.connection.readyState,
    },
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log("Backend corriendo en http://0.0.0.0:" + PORT);
});
