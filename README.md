# Whis

A personal website about creating websites and playing games, featuring a rotating five-leaf grimoire, animated letters, and white/blue and red/black color modes.

## Run

Open `index.html` directly in a modern browser, or serve this directory with any static server. WebGL is required for the 3D book. An illustrated cover is displayed when WebGL is unavailable.

## Deploy on Vercel

Import this repository. Choose **Other**, keep the root directory at the repository root, and leave the build command empty. `vercel.json` supplies the static output settings. No environment variables or dependencies need to be installed.

## Edit

- `index.html`: content and structure
- `style.css`: layout, colors, and responsive styles
- `app.js`: mode switch, annotation lines, particles, and dialogs
- `grimoire.js`: editable Three.js book source
- `grimoire.bundle.js`: browser-ready book bundle, including Three.js

After changing `grimoire.js`, regenerate the bundle:

```sh
npx esbuild@0.25.11 grimoire.js --bundle --format=iife --minify --legal-comments=eof --outfile=grimoire.bundle.js
```

Three.js 0.180.0 is included under its MIT license in `THREE-LICENSE.txt`. Google Fonts supplies DM Sans and IBM Plex Mono, with system font fallbacks. This is an unofficial Black Clover-inspired design.
