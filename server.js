require("dotenv").config({ quiet: true });
const express = require("express");
const path = require("path");
const session = require("express-session");

const siteRoutes = require("./routes/site");
const adminRoutes = require("./routes/admin");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
// Served explicitly (not just via the public/ static mount above)
// because in production this may point at a persistent volume
// outside the app directory — see utils/upload.js and DEPLOY.md.
app.use("/uploads", express.static(require("./utils/upload").UPLOAD_DIR));

if (!process.env.SESSION_SECRET) {
  console.warn(
    "\n[warning] SESSION_SECRET is not set in your environment.\n" +
    "Using a temporary random secret for this run only — every\n" +
    "restart will log everyone out. Set SESSION_SECRET in your\n" +
    ".env (or your host's environment variables) for real use.\n"
  );
}
app.use(session({
  secret: process.env.SESSION_SECRET || require("crypto").randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

app.use("/", siteRoutes);
app.use("/admin", adminRoutes);

// Render/Railway/Fly all sit behind a proxy that terminates HTTPS —
// this tells Express to trust that, which the secure cookie flag above
// depends on to work correctly in production.
app.set("trust proxy", 1);

app.use((req, res) => {
  res.status(404).send('Page not found. <a href="/">Home</a>.');
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong. Check the server logs.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AyDev CMS running at http://localhost:${PORT}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("[warning] ADMIN_PASSWORD is not set — /admin login will always fail until it is.");
  }
});
