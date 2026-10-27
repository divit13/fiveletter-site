# Five Letter — website

A cinematic, editorial one-page site for **Five Letter**, a film & brand studio. Built from scratch with plain HTML, CSS and JavaScript — no frameworks, no build step.

Design direction inspired by bold, type-led studio sites: oversized condensed headlines, a near-black canvas, vermilion accent, film-still collage, mono labels and editorial spacing.

---

## Run it locally

```bash
cd fiveletter-site
python3 -m http.server 8000
```

Open <http://localhost:8000>.

(Any static server works — `npx serve`, Live Server in VS Code, etc. Opening `index.html` directly also works, but a server is recommended so fonts and relative assets behave consistently.)

## Files

```
fiveletter-site/
├── index.html          All page content and structure
├── styles.css          Design system, layout, responsive rules
├── main.js             Menu, reveals, counters, lightbox, copy-to-clipboard
├── assets/
│   ├── founder.jpg     Osama Rahman portrait
│   ├── work-*.jpg      Wonderland Foods film stills (from YouTube)
│   └── og.jpg          1200×630 social sharing card
└── README.md
```

## Deploy

Drop the `fiveletter-site` folder onto any static host:

- **Netlify** — drag the folder into the Netlify dashboard, or set publish directory to `fiveletter-site`.
- **Vercel** — `vercel --prod` from the folder.
- **GitHub Pages** — push the folder contents to a repo and enable Pages.
- **Existing hosting** — upload the contents to the web root or a subfolder.

Then point `fiveletter.in` at the host and replace the current site.

## What's included

- Sticky header with active-section nav and a full-screen mobile menu
- Hero with film-still collage, oversized type and animated stats
- Two scrolling marquees (accent + outline)
- Studio statement, services, selected work (4 films), approach, process, founder, FAQ
- Video lightbox — plays the films via YouTube (no local video hosting needed)
- Copy-email interaction with toast confirmation
- Scroll reveals, count-up stats, hover film previews
- Social sharing card, favicon, Organization schema
- Responsive from 360px up, reduced-motion support, keyboard-accessible menu, FAQ, and lightbox

## Editing content

Everything lives in `index.html`; styling tokens live at the top of `styles.css`.

- **Colours / fonts** — `:root` in `styles.css` (`--ink`, `--cream`, `--accent`, font stacks)
- **Contact email** — appears in the header CTA anchor (`#contact`), contact section, FAQ and footer. Update all occurrences plus `main.js` (`copyBtn` fallback) and the schema block.
- **Social links** — LinkedIn / Instagram URLs in the contact section and footer.
- **Films** — each work card carries `data-video="YOUTUBE_ID"` and `data-title`. Swap the ID and the thumbnail in `assets/`.
- **Stats** — `data-count` values in the hero.
- **Questions** — `<details class="faq-item">` blocks.
- **Social preview** — replace `assets/og.jpg` and update the `og:image` / `twitter:image` paths if the folder moves.

## Notes

- Work thumbnails are pulled from the studio's own YouTube films. If you add a film, export a 16:9 still or use `https://img.youtube.com/vi/<ID>/maxresdefault.jpg`.
- The hero reuses those stills as a dark, blurred collage. Replace `hero-frame` images if you want different frames.
- Fonts are loaded from Google Fonts (Anton, DM Sans, Fragment Mono). Self-host them if you need the site to work fully offline.
- All motion is disabled automatically for visitors who prefer reduced motion.

---

© 2026 Five Letter. Design and build by the studio.
