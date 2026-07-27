const express = require("express");
const router = express.Router();
const store = require("../utils/projectsStore");
const { rich, plateBackground, monogramFor, filterLabel } = require("../utils/renderHelpers");

router.get("/", (req, res) => {
  const projects = store.getFeatured();
  res.render("index", { projects });
});

router.get("/projects", (req, res) => {
  const projects = store.getFeatured();

  const counts = {};
  projects.forEach((p) => {
    const c = p.filterCat || "";
    if (!c) return;
    counts[c] = (counts[c] || 0) + 1;
  });
  const filterCats = Object.keys(counts).map((slug) => ({
    slug,
    label: filterLabel(slug),
    count: counts[slug],
  }));

  res.render("projects", { projects, filterCats, monogramFor });
});

router.get("/work/:slug", (req, res) => {
  const projects = store.getFeatured();
  const index = projects.findIndex((p) => p.slug === req.params.slug);
  if (index === -1) {
    return res.status(404).send(
      "Project not found. <a href=\"/projects\">Back to all work</a>."
    );
  }
  res.render("work", {
    project: projects[index],
    projects,
    index,
    rich,
    plateBackground,
  });
});

module.exports = router;
