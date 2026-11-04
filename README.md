# JKHPMC Website — Delivery Status Dashboard

Standalone static page (no build step, no dependencies). Independent of the main website and backend.
All content lives in `data.js`, taken from `../docs/AUDIT_AND_BACKEND_ROADMAP.md`. Edit statuses there and republish.

## Preview
    cd status-dashboard && python3 -m http.server 8080   # open http://localhost:8080

## Deploy to GitHub Pages
1. Create a new GitHub repo (e.g. `jkhpmc-status`) and push the *contents* of this folder to `main`.
2. Repo Settings → Pages → Source: **GitHub Actions**. The included workflow deploys on every push.
3. Live URL: `https://<github-user>.github.io/<repo>/`
