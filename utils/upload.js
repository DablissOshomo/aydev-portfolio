const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// UPLOADS_DIR lets this point at the same persistent volume as
// DATA_DIR (see utils/projectsStore.js and DEPLOY.md) instead of the
// app's own directory, which most hosts wipe on every redeploy.
// Defaults to ./public/uploads for development.
const UPLOAD_DIR = process.env.UPLOADS_DIR || path.join(__dirname, "..", "public", "uploads");
require("fs").mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(8).toString("hex") + ext;
    cb(null, name);
  },
});

function fileFilter(req, file, cb) {
  if (/^image\//.test(file.mimetype)) return cb(null, true);
  cb(new Error("Only image files are allowed."));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
});

module.exports = upload;
module.exports.UPLOAD_DIR = UPLOAD_DIR;
