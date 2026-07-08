# Notes app (Cordova + GitHub Actions)

A pastel, Samsung Notes style note-taking app. Pure HTML/CSS/JS — no
frameworks, no build tools required to edit it. Notes are saved on
the device using `localStorage`.

## Features
- Grid or list view of notes
- Search by title or content
- Six pastel colors, filterable by chips at the top
- Pin notes to keep them at the top
- Swipe-free simple editor: title + body
- Works fully offline

## Project structure
```
www/            the actual app (open index.html in a browser to preview)
  index.html
  css/style.css
  js/app.js
config.xml      Cordova app configuration (app id, name, permissions)
package.json    Cordova + Android platform dependency versions
.github/workflows/build-apk.yml   builds the APK automatically on push
```

## Preview in a browser (no Android needed)
Just open `www/index.html` directly in any browser, or serve the
`www` folder with any static server. The one line `<script
src="cordova.js">` will fail to load in a browser — that's expected
and harmless, it's only needed inside the real app.

## Get the APK — the easy way (GitHub Actions)
1. Create a new GitHub repository and push this entire folder to it.
2. Go to the **Actions** tab of your repo — the workflow runs
   automatically on every push to `main` (or trigger it manually
   with **Run workflow**).
3. When it finishes, open the workflow run and scroll to
   **Artifacts** — download `notes-app-debug-apk`.
4. Unzip it, copy the `.apk` to your phone, and install it (you may
   need to allow "install from unknown sources").

## Build the APK yourself (optional, needs Android Studio / SDK)
```bash
npm install -g cordova
npm install
cordova platform add android
cordova build android --debug
```
The APK will appear under
`platforms/android/app/build/outputs/apk/debug/`.

## Customize
- App name / package id → `config.xml`
- Colors → the `:root` variables at the top of `www/css/style.css`
- Everything else → `www/js/app.js` (plain JavaScript, no build step)
