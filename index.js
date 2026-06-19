require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const unidadRoutes = require("./src/routes/unidadRoutes");
const asociacionRoutes = require("./src/routes/asociacionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("T-SAFV API is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/unidades", unidadRoutes);
app.use("/api/asociaciones", asociacionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
