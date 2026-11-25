# Cyber Nexus Artifact Gallery

A static, game-inspired portfolio by Hannah Jasmine Saguinsin. The gallery is built with native HTML, CSS, JavaScript modules, and a custom WebGL renderer; it has no build step, framework, backend, or external runtime dependencies.

## Run locally

Serve the project directory over HTTP so the browser can load its JavaScript modules:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000/>. A local static HTTP server is required; opening `index.html` directly with a `file://` URL is not supported by browser module security rules.

## Controls

- Select an artifact in the 3D scene or use the destination buttons to open its content.
- Drag the scene to adjust the camera. Use the reset button to restore the default view.
- Use the arrow keys to move between artifacts, Escape to return to the overview, and Tab/Enter to navigate controls.
- On touch screens, drag horizontally in the scene to rotate; vertical page scrolling remains available.
- Toggle motion, sound, and graphics quality in the top bar. The entrance dialog can be dismissed with its button or Escape.
- If WebGL initialization or rendering fails, the gallery switches to a Canvas 2D 3D renderer. If that also fails, the destination buttons and content remain available.

## Project files

- `index.html` — document structure, accessible controls, and relative asset references.
- `style.css` — responsive layout, gallery styling, and interaction states.
- `main.js` — application startup, content panels, navigation, controls, and entrance dialog.
- `config.js` — personal details, artifact content, theme, projects, and social URLs.
- `scene.js` — WebGL scene, geometry, animation, picking, camera controls, and Canvas fallback.

## Customize content

Edit `config.js` to update the name, title, biography, education, skills, projects, theme colors, and social links. The five artifact definitions include their IDs, names, descriptions, models, colors, and positions. Optional email and CV links are hidden when their values are empty.

Keep the module paths relative (`./main.js`, `./style.css`, `./config.js`, and `./scene.js`). This allows the site to work both at a domain root and under a GitHub Pages project subpath. No service worker is registered; if a browser appears to show an older copy, perform a hard refresh and verify that the browser is requesting the current files.

## Deployment

The site is compatible with GitHub Pages. Publish the repository root (or configure Pages to publish the directory containing `index.html`); all required files are static assets.
