# 🔊 LeetCode Sound FX

> **Make problem solving fun.** Play any custom sound when you Run or Submit — and get roasted when it's wrong.

[![GitHub release](https://img.shields.io/github/v/release/CodeCenturian/LeetCode-Sound-FX?style=flat-square&color=8fd3ff&label=version)](https://github.com/CodeCenturian/LeetCode-Sound-FX/releases/latest)
[![Download count](https://img.shields.io/github/downloads/CodeCenturian/LeetCode-Sound-FX/total?style=flat-square&color=7fffb2&label=downloads)](https://github.com/CodeCenturian/LeetCode-Sound-FX/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-orange?style=flat-square)](LICENSE)

LeetCode is already stressful enough. This extension adds a tiny bit of dopamine (or comic punishment) to every Run and Submit, so grinding through problems feels a little less like work and a little more like a game.

---

## What's new in v1.0.1

- Fixed Run and Submit sounds occasionally playing for the wrong action.
- Fixed Run playing the "correct" sound even when one of several test cases failed.
- Detection now tracks your actual Run/Submit clicks, making it far more reliable.

---

## What it does

The extension listens for results on LeetCode and plays a sound of your choice — no cloud, no tracking, no accounts. Just vibes. Run and Submit each get their own independent pair of sounds:

- ▶️ **Run** → separate sounds for **Correct** and **Wrong**, so testing your code feels just as alive as submitting it
- 🏁 **Submit** → separate sounds for **Accepted** and **Wrong Answer**
- 🔈 Independent volume control for each of the four sounds
- 🔕 Toggle any sound on or off without losing your file
- 💾 Sounds are stored locally in your browser — nothing leaves your machine

---

## Installation

> The extension is not on the Chrome Web Store yet — you load it directly from the downloaded files. Takes about 60 seconds.

### Step 1 — Download the latest release

**👉 [Download leetcode-sound-fx-v.1.0.1.zip](https://github.com/CodeCenturian/LeetCode-Sound-FX/releases/download/v1.0.1/leetcode-sound-fx-v.1.0.1.zip)**

Or grab whatever is current from the **[releases page](https://github.com/CodeCenturian/LeetCode-Sound-FX/releases/latest)** — click the `.zip` file under **Assets** (not "Source code"). Then extract / unzip it somewhere you'll remember — your Desktop works fine.

<img width="601" height="227" alt="image" src="https://github.com/user-attachments/assets/32ab7684-50e3-4df1-80b7-e181e6cf8e09" />

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

<img width="667" height="507" alt="image" src="https://github.com/user-attachments/assets/0821518e-9e93-45e9-af74-dee6d3b6ef14" />


### Step 6 — Set your sounds

Open the popup and you'll see four cards split into two columns — **Run** (Correct / Wrong) and **Submit** (Accepted / Wrong Answer). For each one you want, click **Choose**, pick an audio file, and hit **Save**. You can search for any meme sound or use a clip of your own. Once saved, reload your LeetCode tab (`Ctrl+Shift+R`) and you're ready to go.

---

## Usage

1. Click the extension icon in your toolbar to open the popup.
2. Under the **Run** column, set a sound for **Correct** (all visible test cases pass) and **Wrong** (any test case fails).
3. Under the **Submit** column, set a sound for **Accepted** and **Wrong Answer**.
4. Click **Save** after choosing each file — each of the four slots saves independently.
5. Go solve something on [LeetCode](https://leetcode.com/problems/), hit Run or Submit, and the matching sound plays automatically.

Each of the four sounds has its own volume slider and on/off toggle, so you can mute or silence any one of them without losing the saved file.

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

## Project structure

```
leetcode-sound-fx/
├── manifest.json     # Extension config (MV3)
├── injected.js       # Intercepts LeetCode's fetch/XHR in the page context
├── content.js        # Plays audio using Web Audio API in isolated context
├── popup.html        # Extension popup UI
└── popup.js          # Popup logic — save, load, and manage sounds
```

The extension uses two content scripts working together. `injected.js` runs in the **main world** (same JS context as the page) so it can intercept `fetch` and `XMLHttpRequest` calls that LeetCode makes to check Run and Submit results. It dispatches a custom `lc-result` event when it sees an outcome. `content.js` listens for that event and plays the appropriate sound using the Web Audio API — no `<audio>` tag, no CORS issues.

---

## Open to collaborations and feedback

This is a side project built for fun, and I'd genuinely love contributions — whether that's a bug report, a feature idea, or a pull request.

Things I'd especially welcome:

- **Firefox support** — the architecture supports it (`browser` API shim is already in place), just needs testing
- **Sound presets** — bundled default sounds so new users don't need to bring their own file right away
- **Streak / milestone sounds** — something special for win streaks or daily-goal completions
- **Design improvements** — better animations, themes, anything that makes it feel more polished

If you find a bug or something doesn't work on your setup, please open an issue with your browser version and what happened. Even a one-line issue helps.

If you just want to say the extension made your LeetCode session more fun — that's honestly the whole point, and I'd love to hear it.

---

## Why this exists

LeetCode is one of those things that can feel like a chore really fast. You're grinding the same patterns, hitting the same walls, staring at the same red "Wrong Answer" banner until it loses all meaning.

The idea here is small but deliberate: **attach a moment of joy or comedy to the outcome**, so the feedback loop feels less mechanical. A silly sound when you finally crack a Hard problem hits different than a silent green banner. A sad trombone on a TLE at least makes you laugh instead of closing the tab.

If this extension makes even one person sit through one more problem they would have quit on — that's the whole goal.

---
## 🐞 Bug Finders

Special thanks to community members who spotted and reported issues:

- [Priyanshu Kumar Yadav](https://github.com/Priyanshukyadav)

---

## License

MIT — do whatever you want with it, attribution appreciated but not required.

---

*Made by **Ashutosh Kumar***
