<p align="center">
  <img src="brand/orgolabs-wordmark.png" alt="orgolabs" width="300">
</p>

# orgolabs/shared — common assets for every lab

Served on GitHub Pages at **https://orgolabs.github.io/shared/**. Labs link these by absolute URL instead of
copying them, so there's **one source of truth** for look-and-feel and the common scripts.

| Asset | URL |
|-------|-----|
| Design system | `https://orgolabs.github.io/shared/styles.css` |
| Generic 3D viewer | `https://orgolabs.github.io/shared/viewer.js` (reads `window.VIEWERS = [{id,key}]`) |
| Reference renderer | `https://orgolabs.github.io/shared/references.js` (renders `window.REFERENCES` into `#ref-list`) |
| Brand | `https://orgolabs.github.io/shared/brand/orgolabs-icon.svg` (+ wordmark, avatar) |

The stylesheet also carries the **reaction-pathway / mechanism diagram** classes (`.scheme`, `.sv-*`) so the
inline SVG schemes in each lab are themed consistently in light and dark.

## How a lab uses it

```html
<link rel="icon" href="https://orgolabs.github.io/shared/brand/orgolabs-icon.svg" type="image/svg+xml" />
<link rel="stylesheet" href="https://orgolabs.github.io/shared/styles.css" />
...
<script>window.VIEWERS = [{ id: "view-x", key: "x" }];</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.5.5/3Dmol-min.js" crossorigin="anonymous"></script>
<script src="js/structures.js"></script>              <!-- lab-specific -->
<script src="https://orgolabs.github.io/shared/references.js"></script>
<script src="https://orgolabs.github.io/shared/viewer.js"></script>
<script src="js/calculator.js"></script>              <!-- lab-specific -->
```

Lab-specific files (`structures.js`, `calculator.js`, content, and the inline mechanism SVG) stay in the lab repo.
Everything shared lives here. All repos are same-origin (`orgolabs.github.io`), so there are no CORS issues.

Content & code: MIT. Part of [orgolabs](https://github.com/orgolabs).
