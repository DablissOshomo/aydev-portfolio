# Deploying the Ay/DEV Work CMS

This is a small Node.js app: it serves your site (landing page, work
archive, individual project pages) AND the `/admin` panel that edits
them, from the same server. There's no separate build step and no
static files to re-upload — saving a project in `/admin` writes
straight to the server's data, and the site reflects it on the very
next request.

## The one thing that can bite you: persistent storage

This app stores your projects in a file (`data/projects.json`) and
your uploaded images in a folder (`public/uploads/`). Most Node
hosting platforms — including Render and Railway's free/starter
tiers — run your app on a filesystem that gets **wiped every time you
redeploy** (pushing new code, or the service restarting). If you skip
this section, your first redeploy after adding projects through
`/admin` will look like data loss.

The fix is a **persistent disk / volume** — storage that survives
redeploys, which you attach to the app and point at with two
environment variables:

- `DATA_DIR` — where `projects.json` lives
- `UPLOADS_DIR` — where uploaded images live

If you don't set these, the app just uses local folders inside the
project (`./data` and `./public/uploads`), which is fine for trying
things out locally but NOT fine once this is live and you're actually
adding real projects.

## Recommended: Render

Render is the most beginner-friendly of the three options and has a
straightforward persistent disk. Steps:

1. **Push this project to a GitHub repo.** (Render deploys from Git —
   if you're not already using Git: `git init`, `git add .`,
   `git commit -m "initial commit"`, then create a repo on GitHub and
   push to it. Render's own docs walk through this if you're new to
   it.)
2. On [render.com](https://render.com), **New → Web Service**, connect
   the repo.
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Instance type:** the free tier works, but free instances spin
     down after inactivity and take ~30s to wake back up — the
     cheapest paid tier ($7/mo at time of writing) avoids that and
     also unlocks persistent disks, which you need anyway (see below).
4. **Add a Persistent Disk** (Render dashboard → your service →
   Disks): mount path `/data`, size 1GB is plenty to start.
5. **Environment variables** (Render dashboard → your service →
   Environment):
   - `ADMIN_PASSWORD` — your admin login password
   - `SESSION_SECRET` — a random string (generate one locally with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `NODE_ENV` = `production`
   - `DATA_DIR` = `/data`
   - `UPLOADS_DIR` = `/data/uploads`
6. Deploy. Render gives you a URL like `https://your-app.onrender.com`
   — that's your live site, and `https://your-app.onrender.com/admin`
   is your CMS login.

Railway and Fly.io work the same way in spirit (a volume mounted at
some path, the same environment variables pointed at it) — the exact
menus differ but the concept is identical. Render's docs on
persistent disks: https://render.com/docs/disks

## Environment variables reference

See `.env.example` for the full list with explanations. The three
that matter for a real deployment: `ADMIN_PASSWORD`, `SESSION_SECRET`,
and the `DATA_DIR` / `UPLOADS_DIR` pair described above.

## Running it locally first (recommended before deploying)

```
npm install
cp .env.example .env
# edit .env — at minimum set ADMIN_PASSWORD
npm start
```

Then open `http://localhost:3000` for the site and
`http://localhost:3000/admin` for the CMS. Locally, `DATA_DIR` and
`UPLOADS_DIR` are left unset, so everything just lives in this
project's own `data/` and `public/uploads/` folders — nothing extra
to configure.

## Day-to-day use once deployed

- Go to `https://your-site/admin`, log in.
- **+ New project** — fill in the form, upload a cover image if you
  have one, save. The project's page is live at `/work/<slug>`
  immediately — no extra step.
- **Edit** any project the same way; changes are live on save.
- **↑ / ↓** reorders projects — this changes the order on the landing
  carousel and the archive grid.
- **Delete** removes a project and its page entirely (the uploaded
  images stay on disk, unused — harmless, just not cleaned up
  automatically).
- Unchecking "Show on the live site" hides a project everywhere
  without deleting it — handy for drafts.

## What changed from the static-file version

If you used the earlier version of this (the one where you'd export
`projects-data.js` and duplicate `work-*.html` files by hand) — all
of that is gone. There's no export step, no template duplication, no
`aydev-cms.js` client-side hydration. Every page (`/`, `/projects`,
`/work/:slug`) is rendered by the server from `data/projects.json` on
each request, and `/admin` edits that file directly. The three
`views/*.ejs` files are the same designs as before, just templated
instead of static.

## Backing up your data

`data/projects.json` is the entire content of your site. It's worth
occasionally downloading a copy (via your host's disk/shell access,
or by adding a quick backup step later) — there's no built-in
export button in this version since it's no longer the primary
workflow, but the file is plain, readable JSON if you ever need to
copy it out by hand.
