const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { handleChat, clearSession } = require("../controllers/chatController");

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// ─── FILE FILTER (CSV + PDF + TXT) ────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = [
    "text/csv",
    "text/plain",
    "application/pdf",
    "application/vnd.ms-excel",
  ];
  const allowedExts = [".csv", ".txt", ".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV, PDF, or TXT files are allowed."), false);
  }
};

// ─── MULTER SETUP ─────────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────
router.post("/", upload.single("file"), handleChat);
router.post("/clear", clearSession);

// ─── MULTER ERROR HANDLER ─────────────────────────────────────────────────────
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;