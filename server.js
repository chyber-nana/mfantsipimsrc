const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('dotenv').config();
const session = require('express-session');

app.use(session({
  secret: "supersecretkey",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(express.static(path.join(__dirname, 'public')));

const categoryRoutes = require("./server/routes/categoryRoutes");
const nomineeRoutes = require("./server/routes/nomineeRoutes");
const voteRoutes = require("./server/routes/voteRoutes");
const dashboardRoutes = require("./server/routes/dashboardRoutes");
const paymentRoutes = require("./server/routes/paymentRoutes");
const adminRoutes = require('./server/routes/admin');
const authRoutes = require('./server/routes/auth');

// serve frontend
function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}
// routes
app.use("/api/categories", categoryRoutes);
app.use("/api/nominees", nomineeRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', requireAdmin, adminRoutes);


// default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/payment/callback", async (req, res) => {
  const { reference } = req.query;
  if (!reference) {
    return res.send("Missing reference");
  }

  res.redirect(`/payment-success.html?reference=${encodeURIComponent(reference)}`);
});

app.get('/admin', (req, res) => {
  if (!req.session.admin) {
    return res.redirect('/admin-login.html');
  }

  res.sendFile(path.join(__dirname, 'private', 'admin.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});