const express = require("express");
const router = express.Router();
const store = require("../utils/projectsStore");
const upload = require("../utils/upload");
const { requireAuth, checkPassword } = require("../middleware/auth");

const CASE_ADVANCED_KEYS = [
  "eyebrowTag", "caseTitle", "caseSub", "links", "facts",
  "overviewEyebrow", "overviewHeading", "galleryEyebrow", "galleryHeading", "gallery",
  "decisionsEyebrow", "decisionsHeading", "decisionsSub", "decisions",
];

// ---- auth ----
router.get("/login", (req, res) => {
  res.render("admin/login", { error: null });
});

router.post("/login", (req, res) => {
  if (checkPassword(req.body.password || "")) {
    req.session.authed = true;
    return res.redirect("/admin");
  }
  res.render("admin/login", { error: "Wrong password." });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin/login"));
});

// ---- everything below requires auth ----
router.use(requireAuth);

router.get("/", (req, res) => {
  const projects = store.getAll();
  res.render("admin/dashboard", { projects, message: req.query.msg || null });
});

router.get("/new", (req, res) => {
  res.render("admin/form", { project: null, error: null, caseAdvancedJson: "" });
});

router.get("/edit/:slug", (req, res) => {
  const project = store.getBySlug(req.params.slug);
  if (!project) return res.redirect("/admin?msg=" + encodeURIComponent("Project not found."));
  const advanced = {};
  CASE_ADVANCED_KEYS.forEach((k) => {
    const v = project[k];
    const isEmptyArray = Array.isArray(v) && v.length === 0;
    if (v !== undefined && v !== "" && !isEmptyArray) advanced[k] = v;
  });
  const caseAdvancedJson = Object.keys(advanced).length ? JSON.stringify(advanced, null, 2) : "";
  res.render("admin/form", { project, error: null, caseAdvancedJson });
});

router.post("/save", upload.single("coverImageFile"), (req, res) => {
  const body = req.body;
  const originalSlug = body.originalSlug || "";

  let advanced = {};
  if ((body.caseAdvanced || "").trim()) {
    try {
      advanced = JSON.parse(body.caseAdvanced);
    } catch (err) {
      return res.render("admin/form", {
        project: { ...body, slug: originalSlug || store.slugify(body.title) },
        error: "The case-study JSON field isn't valid JSON: " + err.message,
        caseAdvancedJson: body.caseAdvanced,
      });
    }
  }

  const slug = (body.slug || "").trim() || store.slugify(body.title);
  let coverImage = body.existingCoverImage || "";
  if (req.file) coverImage = "/uploads/" + req.file.filename;
  if (body.removeCoverImage === "1") coverImage = "";

  const project = Object.assign(
    {
      slug,
      title: (body.title || "").trim(),
      category: (body.category || "").trim(),
      filterCat: (body.filterCat || "").trim(),
      monogram: (body.monogram || "").trim(),
      status: (body.status || "Live").trim(),
      color1: body.color1 || "#B9536E",
      color2: body.color2 || "#8F2F10",
      coverImage,
      year: (body.year || "").trim(),
      client: (body.client || "").trim(),
      tags: (body.tags || "").split(",").map((s) => s.trim()).filter(Boolean),
      summary: (body.summary || "").trim(),
      description: (body.description || "").replace(/\r\n/g, "\n"),
      liveUrl: (body.liveUrl || "").trim(),
      featured: body.featured === "on",
    },
    advanced
  );

  try {
    if (originalSlug) {
      store.update(originalSlug, project);
    } else {
      store.create(project);
    }
  } catch (err) {
    return res.render("admin/form", {
      project: { ...project, slug: originalSlug || project.slug },
      error: err.message,
      caseAdvancedJson: body.caseAdvanced || "",
    });
  }

  res.redirect("/admin?msg=" + encodeURIComponent("Saved — live at /work/" + slug));
});

router.post("/delete/:slug", (req, res) => {
  try {
    store.remove(req.params.slug);
    res.redirect("/admin?msg=" + encodeURIComponent("Deleted."));
  } catch (err) {
    res.redirect("/admin?msg=" + encodeURIComponent(err.message));
  }
});

router.post("/move/:slug/:dir", (req, res) => {
  const all = store.getAll();
  const idx = all.findIndex((p) => p.slug === req.params.slug);
  if (idx === -1) return res.redirect("/admin");
  const dir = req.params.dir === "up" ? -1 : 1;
  const swapWith = idx + dir;
  if (swapWith < 0 || swapWith >= all.length) return res.redirect("/admin");
  const slugs = all.map((p) => p.slug);
  [slugs[idx], slugs[swapWith]] = [slugs[swapWith], slugs[idx]];
  store.reorder(slugs);
  res.redirect("/admin");
});

module.exports = router;
