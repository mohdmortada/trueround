# TrueRound

Verified athlete platform for amateur MMA, prepared as a partnership proposal for GAMMA (Global Association of Mixed Martial Arts). Sibling of Taegeuk.

## What's here

| Path | What |
| --- | --- |
| `index.html`, `credits.html`, `assets/`, `brand/` | The marketing site, served by GitHub Pages at the root. Published from `www/` (kept out of git) by `tools/publish_site.mjs`. |
| `demo/index.html` | Copy of `app/dist/index.html`: the live demo the site links to. |
| `app/dist/index.html` | The working app, one self-contained file. Deploy this. |
| `app/src/` | App source: `app.js` (React 18 + htm, no build step), `data.js` (demo data), `app.css`. |
| `design-system/project/` | Design system source: `tokens.json`, `components/bundle.js` + `bundle.css` (`window.TrueRound`), component guidelines and previews, logos, brand book (`README.md`). |

## Deploy the app

The app is a single static HTML file, so any static host works.

**Vercel** (needs Node.js and a Vercel account):

```bash
npx vercel deploy app/dist --prod
```

**GitHub Pages** (needs a GitHub account):

1. Create an empty public repository, for example `trueround`.
2. From this folder: `git remote add origin https://github.com/<you>/trueround.git` then `git push -u origin main`.
3. In the repository: Settings → Pages → Source "Deploy from a branch" → branch `main`, folder `/ (root)`. Add a root `index.html` that redirects to `app/dist/` or move `app/dist/index.html` to the root.

## Publish the site and the demo

The site was built with the design-taste-frontend skill in `www/` (the full kit, its check history and screenshots stay there, out of git). After editing `www/index.html` or rebuilding the app:

```bash
node tools/publish_site.mjs
```

It copies the files the page loads (about 30 of the kit's) to the root and `app/dist/index.html` to `demo/index.html`.

## Rebuild the app after editing `app/src`

`app/dist/index.html` is assembled from `app/src/*`, `design-system/project/components/bundle.*` and the tokens compiled from `tokens.json`:

```bash
python tools/build_app.py app/src design-system/project app/dist
```

It writes `app/dist/index.html` (deployable) and `app/dist/trueround-app.html` (the claude.ai artifact version). Python 3, no packages needed.
