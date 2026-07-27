# Ay/DEV — Site + Work CMS

Your portfolio site (landing page, work archive, individual project
pages) and the `/admin` panel that manages them, as one small Node.js
app. Editing a project in `/admin` publishes it immediately — no
export step, no file duplication.

**Start here → [DEPLOY.md](./DEPLOY.md)** for local setup and
deploying to a real host (persistent storage is the one thing to get
right — DEPLOY.md explains why and how).

## Project layout

```
server.js              App entry point
routes/site.js          Public routes: /, /projects, /work/:slug
routes/admin.js          /admin — login, dashboard, create/edit/delete
views/                  EJS templates (index, projects, work + admin/*)
utils/projectsStore.js  Reads/writes data/projects.json
utils/upload.js         Image upload handling (multer)
utils/renderHelpers.js  Shared template helpers (rich text, etc.)
middleware/auth.js      Single-password session auth for /admin
data/projects.json      Your content — the single source of truth
public/uploads/         Uploaded project images
```

## Quick start

```
npm install
cp .env.example .env      # then set ADMIN_PASSWORD in it
npm start
```

Site: http://localhost:3000 — Admin: http://localhost:3000/admin
