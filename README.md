# Procedural Pet

A tiny slime blob that lives on your Mac desktop. It floats above your windows, follows your cursor with its eyes, and reacts when you poke it.

There are no images or GIFs: the pet is drawn and animated entirely in code on an HTML5 `<canvas>`, using spring physics. It runs on [tinyjs](https://tinyjs.app), which gives it a transparent, frameless, always-on-top native window in about 6 MB.

## Requirements

- macOS
- tinyjs (built against v0.41.0):

  ```bash
  curl -fsSL https://tinyjs.app/install | sh
  ```

No Node.js or `npm install` needed.

## Run

```bash
tinyjs dev
```

The pet appears on screen. Edits to the page reload live; changes to `tinyjs.json` need a restart.

To build a standalone app:

```bash
tinyjs build
```

This creates a signed `.app` in `dist/` that you can move to Applications.

To quit, click the pet and press ⌘Q, or right-click its Dock icon.

### Windows `.exe`

tinyjs builds for the OS it runs on, so a Mac can't produce a `.exe`. Either run `tinyjs build` on a Windows machine, or push to GitHub: the [Build workflow](.github/workflows/build.yml) builds the macOS `.app` (universal) and the Windows `.exe` on every push to `main`. Download them from the run's **Artifacts** section in the Actions tab.

## What it does

| Do this | The pet does that |
|---|---|
| Move the cursor anywhere on screen | Its face turns and its eyes follow |
| Click it | Squishes, bounces and smiles ^‿^ |
| Click it 3 times quickly | Melts into a puddle, then springs back |
| Drag it | Moves the window |
| Leave it alone | Breathes and blinks |
| **Feed** | An apple drops in, it opens wide and chomps it (+Food) |
| **Play** | Jumps with little hearts (+Fun, costs Energy and a bit of Food) |
| **Sleep** / **Wake** | Curls up, snores z's and recharges Energy; wakes on its own when full, or when you poke it |

### Needs

Three bars under the pet (Food, Fun, Energy) drain slowly while it's awake. When any of them drops below 20 the pet gets glum (half-closed eyes, a little frown), and below 25 the bar pulses. Feeding a full pet makes it shake its head, and a pet with no energy yawns instead of jumping.

Stats are saved every few seconds. When you reopen the app it catches up on the time it was closed, but no bar drops below 10 while you're away.

## Project layout

```
├── tinyjs.json            window config: 220×320, frameless, transparent
├── package.json
└── src/
    ├── main.js            backend: keeps the window on top, logs pet events
    └── frontend/
        ├── index.html     markup: canvas, status card, icons
        ├── css/style.css  card and button styles (light + dark)
        └── js/            plain scripts, loaded in this order:
            ├── core.js    canvas setup, springs, shared state
            ├── pet.js     needs, actions (feed/play/sleep), moods, particles
            ├── draw.js    face, sprout, apple, hearts: pure drawing
            ├── input.js   cursor tracking, poke vs drag
            ├── panel.js   bars and buttons
            └── main.js    frame loop and startup
```

## How it works

- **Springs.** Every motion (gaze, body wobble, squash, melt) is a damped spring stepped each frame with a time-based step, so it runs at the same speed on 60 Hz and 120 Hz screens.
- **Face on a sphere.** Facial features are placed by angle on the blob's round body and projected to the screen, so they slide and foreshorten as the head turns. Each eye is its own small sphere: the pupil rolls across it while the shine stays fixed to the light.
- **Global cursor.** Inside tinyjs the page polls `tiny.app.mousePosition()`, so the eyes track the cursor across the whole screen, not just the window.
- **Squash and stretch.** The body keeps its bottom on the ground and roughly preserves volume: height lost to a squish goes into width.
- **No build step.** The scripts are classic `<script>` tags sharing globals rather than ES modules, because WebKit blocks module imports from `file://` pages, which is how tinyjs loads the frontend.
- **Browser preview.** Opening `src/frontend/index.html` in a browser also works; it falls back to normal mouse events and skips the window features.

## Ideas for later

- Soft-body outline: replace the ellipse with a ring of points joined by Verlet springs for real jelly deformation.
- Hide the Dock icon and add a menu-bar item to quit (`"activation": "accessory"` plus a tray menu).
- Open at login.
