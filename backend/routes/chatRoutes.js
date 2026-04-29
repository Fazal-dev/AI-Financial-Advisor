const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { handleChat } = require("../controllers/chatController");

// 🔥 STORAGE CONFIG
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder to save files
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// 🔥 FILE FILTER (ONLY CSV/TXT)
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "text/csv" ||
    file.mimetype === "text/plain" ||
    file.originalname.endsWith(".csv") ||
    file.originalname.endsWith(".txt")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV or TXT files allowed"), false);
  }
};

// 🔥 MULTER SETUP
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// 🔥 MAIN ROUTE (THIS IS THE KEY FIX)
router.post("/", upload.single("file"), handleChat);

module.exports = router;