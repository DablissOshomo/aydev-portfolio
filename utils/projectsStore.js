const fs = require("fs");
const path = require("path");

// DATA_DIR lets this point at a persistent disk/volume on your host
// (e.g. Render's Persistent Disk, a Railway/Fly volume) instead of the
// app's own directory, which most hosts wipe on every redeploy. See
// DEPLOY.md. Defaults to the local ./data folder for development.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const DATA_PATH = path.join(DATA_DIR, "projects.json");

// Every write goes through this queue so two near-simultaneous saves
// (e.g. a double click) can't interleave and corrupt the JSON file.
let queue = Promise.resolve();
function enqueue(fn) {
  queue = queue.then(fn, fn);
  return queue;
}

function readAll() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

function writeAll(projects) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2), "utf-8");
}

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[+&]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getAll() {
  return readAll();
}

function getFeatured() {
  return readAll().filter((p) => p.featured !== false);
}

function getBySlug(slug) {
  return readAll().find((p) => p.slug === slug) || null;
}

function create(project) {
  return enqueue(() => {
    const all = readAll();
    if (!project.slug) project.slug = slugify(project.title);
    if (all.some((p) => p.slug === project.slug)) {
      throw new Error('A project with slug "' + project.slug + '" already exists.');
    }
    all.push(project);
    writeAll(all);
    return project;
  });
}

function update(slug, updatedProject) {
  return enqueue(() => {
    const all = readAll();
    const idx = all.findIndex((p) => p.slug === slug);
    if (idx === -1) throw new Error('No project with slug "' + slug + '".');
    // Allow the slug itself to change, but guard against colliding
    // with a different existing project.
    const newSlug = updatedProject.slug || slug;
    if (newSlug !== slug && all.some((p) => p.slug === newSlug)) {
      throw new Error('A project with slug "' + newSlug + '" already exists.');
    }
    all[idx] = updatedProject;
    writeAll(all);
    return updatedProject;
  });
}

function remove(slug) {
  return enqueue(() => {
    const all = readAll();
    const next = all.filter((p) => p.slug !== slug);
    if (next.length === all.length) throw new Error('No project with slug "' + slug + '".');
    writeAll(next);
    return true;
  });
}

function reorder(slugsInOrder) {
  return enqueue(() => {
    const all = readAll();
    const bySlug = new Map(all.map((p) => [p.slug, p]));
    const reordered = slugsInOrder.map((s) => bySlug.get(s)).filter(Boolean);
    // Anything not mentioned (shouldn't happen) is appended at the end.
    all.forEach((p) => { if (!slugsInOrder.includes(p.slug)) reordered.push(p); });
    writeAll(reordered);
    return reordered;
  });
}

module.exports = { getAll, getFeatured, getBySlug, create, update, remove, reorder, slugify };
