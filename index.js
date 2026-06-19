require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const unidadRoutes = require("./src/routes/unidadRoutes");
const asociacionRoutes = require("./src/routes/asociacionRoutes");
const invitacionRoutes = require("./src/routes/invitacionRoutes");
const propietarioRoutes = require("./src/routes/propietarioRoutes");
const fiscalRoutes = require("./src/routes/fiscalRoutes");
const exportRoutes = require("./src/routes/exportRoutes");
const membresiaRoutes = require("./src/routes/membresiaRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("T-SAFV API is running!");
});

app.use("/api/auth", authRoutes);
app.use("/api/unidades", unidadRoutes);
app.use("/api/asociaciones", asociacionRoutes);
app.use("/api/invitaciones", invitacionRoutes);
app.use("/api/propietario", propietarioRoutes);
app.use("/api/fiscal", fiscalRoutes);
app.use("/api/export", exportRoutes);
app.use("/api", membresiaRoutes);

const errorHandler = require("./src/middlewares/errorHandler");

// middleware final para manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
