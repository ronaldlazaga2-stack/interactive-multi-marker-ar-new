# Hiro AR Robot

A beginner-friendly WebAR project built with A-Frame 1.4.2 and AR.js 3.4.5.  
Point your phone camera at a **Hiro marker** to see a colourful 3-D robot appear above it.

---

## What this project does

- Shows a splash screen with a **Start Camera** button.
- Asks for camera permission when the button is tapped.
- Displays the live camera feed full-screen.
- Detects the standard **Hiro marker**.
- Places a 3-D robot (built from A-Frame primitives) above the marker.
- Updates a status bar honestly: it never says “Camera running” until the video stream is actually live, and never says “Marker detected” unless the marker-detection event fires.
- Lets you retry after any error.

---

## Libraries (CDN — internet required)

| Library | Version | CDN URL |
|---------|---------|----------|
| A-Frame | 1.4.2 | `https://aframe.io/releases/1.4.2/aframe.min.js` |
| AR.js (A-Frame build) | 3.4.5 | `https://raw.githack.com/AR-js-org/AR.js/3.4.5/aframe/build/aframe-ar.js` |

Both versions are **pinned**. Do not replace them with `master` or `latest` URLs — unpinned URLs can silently break.

Your device must have internet access when the page loads.

---

## The Hiro marker

You need the Hiro marker image to test the project.  
Get it from the official AR.js repository:

```
https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png
```

Options:
- **Print it** on paper.
- **Open it on a second screen** (another phone, tablet, or monitor) and point your test device at it.

The marker is a square black border with a pattern inside. Hold it flat and steady under good lighting.

---

## Project files

```
hiro-ar/
├── index.html   ← HTML structure + A-Frame scene + robot geometry
├── style.css    ← Layout, colours, z-index stack, mobile rules
├── script.js   ← Camera start/stop logic, status updates, marker events
└── README.md   ← This file
```

No other files are needed. No custom marker pattern files, no external images, no build tools.

---

## C. Beginner setup instructions (VS Code + Live Server)

### Step 1 — Create the project folder

1. Open **File Explorer** (Windows) or **Finder** (Mac).
2. Create a new folder somewhere easy to find, for example `Desktop › hiro-ar`.

### Step 2 — Create the files

In VS Code:
1. Choose **File › Open Folder** and open your `hiro-ar` folder.
2. Click the **New File** icon in the Explorer panel and create these four files, one at a time:  
   `index.html`, `style.css`, `script.js`, `README.md`

### Step 3 — Paste the code

Copy the code from each labelled block in the response and paste it into the matching file. Save each file with **Ctrl + S** (Windows) or **Cmd + S** (Mac).

### Step 4 — Install Live Server (once)

1. Click the **Extensions** icon in VS Code (or press `Ctrl + Shift + X`).
2. Search for **Live Server** by Ritwick Dey.
3. Click **Install**.

### Step 5 — Run with Live Server

1. Open `index.html` in the VS Code editor.
2. Click **Go Live** in the bottom-right status bar (or right-click in the editor and choose **Open with Live Server**).
3. Your browser opens at `http://127.0.0.1:5500` or similar.

> **Why localhost works:** Browsers allow camera access on `localhost` even without HTTPS. GitHub Pages provides real HTTPS for phone testing.

### Step 6 — Allow camera permission

1. Click **Start Camera**.
2. The browser asks for camera permission — click **Allow**.
3. The status bar should change to **“Camera running — point at the Hiro marker.”**  
   This message only appears after the video stream is confirmed live.

### Step 7 — Test with the Hiro marker

1. Open the Hiro image on another device or print it.
2. Hold it flat in good light.
3. Point your camera at it until it fills roughly 1/3 of the screen.
4. The status bar should say **“Hiro marker detected!”** and the robot appears.

---

## D. GitHub Pages instructions (HTTPS for your phone)

> Your phone cannot reach your computer’s `localhost`. You must publish the project to GitHub Pages to get an HTTPS URL your phone can open.

### Step 1 — Create a GitHub account

If you don’t have one: <https://github.com>

### Step 2 — Create a new repository

1. Log in to GitHub.
2. Click the **+** icon (top right) › **New repository**.
3. Name it `hiro-ar` (or any name you like).
4. Set it to **Public**.
5. Click **Create repository**.

### Step 3 — Upload your files

1. On the repository page, click **Add file › Upload files**.
2. Drag your four files (`index.html`, `style.css`, `script.js`, `README.md`) into the upload area.
3. Scroll down and click **Commit changes**.

### Step 4 — Enable GitHub Pages

1. Click **Settings** (in your repository).
2. In the left sidebar, click **Pages**.
3. Under **Branch**, select `main` (or `master`) and click **Save**.
4. GitHub shows a banner: “Your site is published at `https://YOUR-USERNAME.github.io/hiro-ar/`”  
   (It can take 1–2 minutes to go live.)

### Step 5 — Open on your phone

1. On your phone, open Chrome or Safari.
2. Go to `https://YOUR-USERNAME.github.io/hiro-ar/`  
   (Replace `YOUR-USERNAME` with your actual GitHub username.)
3. Tap **Start Camera** and allow camera permission.
4. Point at the Hiro marker.

> ⚠️ **Do not open the `localhost` URL on your phone.** Your phone cannot reach your computer’s local server. Only the `github.io` HTTPS URL works on your phone.

---

## E. Troubleshooting

### Camera shows a black screen

| Check | Fix |
|-------|-----|
| Are you on `http://` (not `https://` or `localhost`)? | Use VS Code Live Server (localhost) or GitHub Pages (HTTPS). |
| Did you allow camera permission? | Check your browser/phone settings and allow the camera for this site. |
| Is another app using the camera? | Close other apps (video call, camera app) and retry. |
| Does the status say “Starting AR…” and never change? | Wait up to 15 seconds; the app times out and shows an error with a Retry button. |
| Black canvas on top of video? | Make sure no CSS change adds `background: black` to `a-scene` or `canvas`. |

### Camera permission denied

- The status bar shows an error message.
- **iOS Safari:** Settings › Safari › Camera › Allow.
- **Android Chrome:** tap the lock icon in the address bar › Site settings › Camera › Allow. Reload the page and tap Start Camera again.
- The **Retry Camera** button resets the app so you can try again.

### Marker not detected / robot does not appear

| Check | Fix |
|-------|-----|
| Is the marker image correct? | Use the exact URL in this README — the Hiro pattern is specific. |
| Is the marker too dark or too small? | Print at full page size or display on a bright screen. |
| Is the lighting too dim? | Move to a brighter area. |
| Is the camera too close? | Hold the marker so the black border is fully visible with a small margin. |
| Is the page running on `http://` without a camera stream? | Camera must be live before marker detection can work. |

### Robot appears but is sideways or underground

This is a marker-orientation issue. Try rotating the marker 90° and see if the robot stands upright. The Y-axis in A-Frame points up from the marker surface.

### Libraries fail to load

You see a script error or blank page. Check your internet connection; the CDN scripts must download on every page load.

---

## F. Testing checklist

Work through these checks in order. Each one must pass before moving to the next.

### 1. Live camera feed
- [ ] Tapped **Start Camera** on `localhost` or an HTTPS URL.
- [ ] Browser prompted for camera permission and you clicked **Allow**.
- [ ] Status changed to **“Camera running — point at the Hiro marker.”** (not just after the button was clicked, but after the video became live).
- [ ] The camera image fills the screen behind the AR canvas.
- [ ] The screen is not black.

### 2. Marker detection
- [ ] Opened the Hiro image on another screen or printed it.
- [ ] Held it flat and steady under good light.
- [ ] Pointed the camera at it until the status changed to **“Hiro marker detected!”**
- [ ] This message appeared only when the marker was in frame — not before.

### 3. Robot visibility
- [ ] The robot appeared above the marker when detection fired.
- [ ] The robot is centred over the marker.
- [ ] The robot is visible and colourful (blue body, yellow eyes, red antenna).
- [ ] The robot does not cover the entire camera view.

### 4. Marker loss
- [ ] Covered the marker or moved it out of frame.
- [ ] Status changed to **“Marker lost — point at the Hiro marker.”**
- [ ] The robot disappeared when the marker was no longer visible.

### 5. Mobile portrait layout
- [ ] Opened the page on a phone in portrait orientation (or resized the browser to a narrow width).
- [ ] No horizontal scrollbar is visible.
- [ ] The **Start Camera** button is easy to tap.
- [ ] Status text is readable.
- [ ] The splash screen fits the screen without requiring zoom or scroll.

### 6. Error recovery
- [ ] Denied camera permission (or tried on `http://`).
- [ ] The app displayed a clear error message.
- [ ] The **Retry Camera** button appeared and reset the app correctly.

---

## Honesty note

This code has been written and reviewed carefully against all the requirements, but it has **not been run in a live browser with actual camera access** during this session — sandbox environments do not have physical cameras. The logic, z-index stack, CSS, and event wiring have all been checked by code inspection. Before declaring it complete, please run the testing checklist above on a real device.
