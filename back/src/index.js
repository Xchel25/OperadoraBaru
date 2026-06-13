require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const authRoutes        = require("./routes/auth.routes");
const userRoutes        = require("./routes/user.routes");
const capacitacionRoutes = require("./routes/capacitacion.routes");
const comunicacionRoutes = require("./routes/comunicacion.routes");
const indicadoresRoutes  = require("./routes/indicadores.routes");
const reporteRoutes      = require("./routes/reporte.routes");
const deviceRoutes       = require("./routes/device.routes");
const chatbotRoutes      = require("./routes/chatbot.routes");
const { errorHandler }   = require("./middlewares/error.middleware");

const app = express();

// Seguridad y parseo
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (documentos subidos)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rutas de la API
app.use("/api/auth",         authRoutes);
app.use("/api/usuarios",     userRoutes);
app.use("/api/capacitacion", capacitacionRoutes);
app.use("/api/comunicacion", comunicacionRoutes);
app.use("/api/indicadores",  indicadoresRoutes);
app.use("/api/reportes",     reporteRoutes);
app.use("/api/devices",     deviceRoutes);
app.use("/api/chatbot",     chatbotRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Operadora Barú API", version: "1.0.0" });
});

// Manejador de errores global
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
});
