# 🔊 LeetCode Sound FX

> **Make problem solving fun.** Play any custom sound when you get Accepted — or get roasted when you don't.

[![GitHub release](https://img.shields.io/github/v/release/CodeCenturian/LeetCode-Sound-FX?style=flat-square&color=8fd3ff&label=version)](https://github.com/CodeCenturian/LeetCode-Sound-FX/releases/latest)
[![Download count](https://img.shields.io/github/downloads/CodeCenturian/LeetCode-Sound-FX/total?style=flat-square&color=7fffb2&label=downloads)](https://github.com/CodeCenturian/LeetCode-Sound-FX/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-orange?style=flat-square)](LICENSE)

LeetCode is already stressful enough. This extension adds a tiny bit of dopamine (or comic punishment) to every submission, so grinding through problems feels a little less like work and a little more like a game.

---

## What it does

The extension listens for submission results on LeetCode and plays a sound of your choice — no cloud, no tracking, no accounts. Just vibes.

- ✅ **Accepted** → play your victory sound (air horn, crowd cheer, your own voice saying "let's go")
- ❌ **Wrong Answer / TLE / Runtime Error** → play your fail sound (sad trombone, your mom's disappointment, whatever keeps you humble)
- 🔈 Independent volume control for each sound
- 🔕 Toggle either sound on or off without losing your file
- 💾 Sounds are stored locally in your browser — nothing leaves your machine

---

## Installation

> The extension is not on the Chrome Web Store yet — you load it directly from the downloaded files. Takes about 60 seconds.

### Step 1 — Download the latest release

**👉 [Download leetcode-sound-fx-v1.0.0.zip](https://github.com/CodeCenturian/LeetCode-Sound-FX/releases/latest)**

On the releases page, click the `.zip` file under **Assets** (not "Source code") to download it. Then extract / unzip it somewhere you'll remember — your Desktop works fine.

<img width="654" height="252" alt="image" src="https://github.com/user-attachments/assets/dea4f7b2-98ad-40ca-bf5b-1bf05e3ec088" />

> **Note:** Please use the releases link above rather than the green "Code → Download ZIP" button on the repo. The releases zip tracks download counts so I can see how many people are using this.

### Step 2 — Open your browser's Extensions page

Paste the URL for your browser directly into the address bar:

| Browser | URL |
|---|---|
| **Chrome** | `chrome://extensions` |
| **Brave** | `brave://extensions` |
| **Edge** | `edge://extensions` |
| **Opera** | `opera://extensions` |

### Step 3 — Enable Developer Mode

In the top-right corner of the Extensions page, toggle **Developer mode** ON.
<img width="693" height="355" alt="image" src="https://github.com/user-attachments/assets/4ea80b19-187f-4e13-bf76-3148e19f9ab2" />


### Step 4 — Load the extension

Click **Load unpacked** (top-left) → navigate to and select the folder you extracted in Step 1. Select the folder itself (the one that contains `manifest.json`), not any file inside it.

<img width="667" height="290" alt="image" src="https://github.com/user-attachments/assets/79323df6-4894-4652-ba58-8f328fe356af" />

You should see the **LeetCode Sound FX** card appear in your extensions list.

### Step 5 — Pin it 

Click the puzzle piece / extensions icon 🧩 in your browser's toolbar → find **LeetCode Sound FX** → click the pin icon so it stays visible.
<img width="687" height="517" alt="image" src="https://github.com/user-attachments/assets/ebead24d-d0e2-40a6-8140-b853ecf1d0cc" />

### Step 6 — Set the Sound Effects

You can searach for any meme sound or anything of your choice and set it there and click save. Now click Ctrl+Shift+R to reload.

You are now ready to test this thing out.

---

## Usage

1. Click the extension icon in your toolbar to open the popup
2. For **Correct Submission**, click **Choose File** and pick any audio file (`.mp3`, `.wav`, `.ogg`, etc.)
3. Click **Save**
4. Do the same for **Wrong Submission**
5. Go solve something on [LeetCode](https://leetcode.com/problems/) and submit — the sound will play automatically

You can adjust the volume slider for each sound independently, and use the toggle to mute one without clearing it.

---

## Supported browsers

| Browser | Status | Extensions page |
|---|---|---|
| Chrome | ✅ Fully supported | `chrome://extensions` |
| Brave | ✅ Fully supported | `brave://extensions` |
| Edge (Chromium) | ✅ Should work | `edge://extensions` |
| Opera | ✅ Should work | `opera://extensions` |
| Firefox | ⚠️ Not tested yet | |
| Safari | ❌ Not supported | — |

---



---

## Project structure

```
leetcode-sound-fx/
├── manifest.json     # Extension config (MV3)
├── injected.js       # Intercepts LeetCode's fetch/XHR in the page context
├── content.js        # Plays audio using Web Audio API in isolated context
├── popup.html        # Extension popup UI
└── popup.js          # Popup logic — save, load, and manage sounds
```

The extension uses two content scripts working together. `injected.js` runs in the **main world** (same JS context as the page) so it can intercept `fetch` and `XMLHttpRequest` calls that LeetCode makes to check submission results. It dispatches a custom `lc-result` event when it sees an outcome. `content.js` listens for that event and plays the appropriate sound using the Web Audio API — no `<audio>` tag, no CORS issues.

---

## Open to collaborations and feedback

This is a side project built for fun, and I'd genuinely love contributions — whether that's a bug report, a feature idea, or a pull request.

Things I'd especially welcome:

- **Firefox support** — the architecture supports it (`browser` API shim is already in place), just needs testing
- **More trigger events** — "Run Code" result sounds, streak sounds, or contest-specific behavior
- **Sound presets** — bundled default sounds so new users don't need to bring their own file right away
- **Design improvements** — better animations, themes, anything that makes it feel more polished

If you find a bug or something doesn't work on your setup, please open an issue with your browser version and what happened. Even a one-line issue helps.

If you just want to say the extension made your LeetCode session more fun — that's honestly the whole point, and I'd love to hear it.

</details>

---

## Why this exists

LeetCode is one of those things that can feel like a chore really fast. You're grinding the same patterns, hitting the same walls, staring at the same red "Wrong Answer" banner until it loses all meaning.

The idea here is small but deliberate: **attach a moment of joy or comedy to the outcome**, so the feedback loop feels less mechanical. A silly sound when you finally crack a Hard problem hits different than a silent green banner. A sad trombone on a TLE at least makes you laugh instead of closing the tab.

If this extension makes even one person sit through one more problem they would have quit on — that's the whole goal.

---

## License

MIT — do whatever you want with it, attribution appreciated but not required.

---

*Made by **Ashutosh Kumar***
