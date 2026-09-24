const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { startSlaCron } = require("./jobs/slaEscalation");

connectDB();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Basic rate limiting on API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/departments", require("./routes/departmentRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/slas", require("./routes/slaRoutes"));
app.use("/api/vendors", require("./routes/vendorRoutes"));
app.use("/api/tickets", require("./routes/ticketRoutes"));
app.use("/api/assets", require("./routes/assetRoutes"));
app.use("/api/kb", require("./routes/kbRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "ServiceDesk Pro API is running", time: new Date() });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ServiceDesk Pro API running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  startSlaCron();
});
