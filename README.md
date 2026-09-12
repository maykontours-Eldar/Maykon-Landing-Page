# Maykon Tours — Landing Page

Static, mobile-first landing page. HTML + Tailwind CSS (compiled to a plain CSS file, no CDN/build step needed at runtime) + vanilla JS. Deploys as-is to GitHub Pages — just push this folder to a repo and enable Pages.

## Structure

```
index.html              all page content/sections
css/output.css           compiled CSS (committed — this is what the page actually loads)
css/input.css             Tailwind source (edit this, not output.css)
js/main.js                all interactivity (hero slideshow, scroll tracker, carousel, form → WhatsApp)
js/accessibility.js        local accessibility toolbar (text size / contrast / links / font) — no external service
assets/logo/               logo + favicon
assets/destinations/        hero background photos (thailand/zanzibar/japan/seychelles/budapest)
assets/reviews/              customer review screenshots (carousel)
tailwind.config.js          brand color palette + theme
privacy-policy.html         standalone privacy policy page
accessibility-statement.html standalone accessibility statement page
```

## Deploying to GitHub Pages

1. Push this whole folder to a GitHub repo.
2. Repo Settings → Pages → Deploy from branch → pick `main` and `/ (root)`.
3. Done — no build step runs on GitHub's side, `css/output.css` is already compiled and committed.

## Making changes

- **Text/content/links:** edit `index.html` directly.
- **Colors/fonts/spacing that use Tailwind classes:** if you add a class that isn't already used elsewhere on the page, you must rebuild the CSS (Tailwind only ships the classes it detects in use):
  ```
  npm install
  npm run build
  ```
  `npm run watch` rebuilds automatically while you edit.
- **Adding a review screenshot:** drop the image into `assets/reviews/`, then add one more carousel card `<div>` in the `#reviews-carousel` block in `index.html` (copy an existing card and swap the image path).
- **Adding/swapping a hero destination photo:** drop the image into `assets/destinations/`, then add/edit one `.hero-bg-slide` block in the hero section of `index.html`.

## Notes on hotlinked stock photos (Mexico hero + services section)

A few photos are hotlinked directly from Pexels (free license, no attribution required) instead of being saved locally, because they were sourced from the web rather than being files you already had:

- **Mexico hero slide** — photographer Camilo Laverde: `https://images.pexels.com/photos/27638882/pexels-photo-27638882.jpeg`
- **Services section — קרוזים בכל העולם** (cruise) — photographer txomcs: `https://images.pexels.com/photos/945177/pexels-photo-945177.jpeg`
- **Services section — השכרות רכבים** (car rentals) — photographer txomcs: `https://images.pexels.com/photos/13512047/pexels-photo-13512047.jpeg`
- **Services section — חבילות כדורגל** (football packages) — photographer Maulana Diki: `https://images.pexels.com/photos/31744929/pexels-photo-31744929.jpeg`
- **Services section — הופעות** (concerts) — photographer Fausto Ferreira: `https://images.pexels.com/photos/36675302/pexels-photo-36675302.jpeg`

They all work as-is on GitHub Pages with no extra setup — no download or account needed. If you'd rather self-host any of them (so the page doesn't depend on Pexels staying up): download the photo, save it into `assets/destinations/mexico.jpg` (hero) or `assets/services/{cruise,car-rental,football,concert}.jpg` (services section — create that folder), then in `index.html` swap that image's `src`/`data-src` from the Pexels URL to the local path.

## Accessibility toolbar

The floating button at the bottom of every page (`js/accessibility.js`) is a fully local, self-built toolbar — no external script, no third-party account or signup, nothing to configure. It lets visitors increase/decrease text size, turn on higher contrast, force-underline links, and switch to a plainer font, and it remembers their choice (via `localStorage`) between visits. If you'd ever rather use a third-party service like UserWay instead, just add its `<script>` tag and remove the `#a11y-widget` block + `js/accessibility.js` include from each HTML file.

## Housekeeping — files no longer referenced

A few files on disk aren't linked from the current page anymore. I can't delete files on your computer from here, so if you want to tidy up, these are safe to remove yourself:

- `assets/destinations/thailand.*`, `zanzibar.*`, `japan.*`, `seychelles.*` (and their flat-root copies `thailand.jpg/webp`, `zanzibar.jpg/webp`, `japan.jpg/webp`, `seychelles.jpg/webp`) — the hero slider now uses Montenegro/Georgia/Greece/Mexico/Budapest, not these.
- `index_3.html` and `README_1.md` at the project root — leftover duplicates from an earlier fix; `index.html` and `README.md` are the ones that matter.

## Fonts

Loaded from Google Fonts (Rubik — reads well in both Hebrew and Latin). Requires internet access to load; if you ever need a fully offline page, the font files would need to be self-hosted instead.
