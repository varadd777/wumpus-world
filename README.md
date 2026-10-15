# 🏹 Wumpus World - AI Logic & Exploration Arena

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-Modern_Glassmorphism-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

An interactive, dark-fantasy enchanted forest reimagining of the classic **Wumpus World** problem from Artificial Intelligence: A Modern Approach (*Stuart Russell & Peter Norvig*). 

Featuring dynamic **Fog of War**, directional archer movement, synthesized procedural Web Audio, an interactive propositional logic solver with real-time probabilistic reasoning, and knowledge-base visualization overlays.

---

## ✨ Features

- **🌲 Enchanted Forest Theme**: Immersive dark fantasy aesthetics with dynamic firefly & spore canvas particles, atmospheric lighting, and high-resolution character artwork.
- **🧠 Propositional Logic AI Agent**:
  - Full belief-state tracking: **Safe**, **Pit Probabilities**, and **Wumpus Suspicion**.
  - Inference engine resolving stench, breeze, glitter, and scream perceptions.
  - Frontier exploration planning with risk-aware pathfinding.
  - Autonomous exploration modes: **Single-Step AI** and continuous **Auto-Play** with adjustable speed.
- **👁️ Visual AI Overlay**: Live visualization of the AI's deductions directly on cavern tiles (Breeze, Stench, Pit%, Wumpus danger, and Confirmed Safe paths).
- **🔊 Web Audio Synthesizer**: Zero external audio files—pure Web Audio API procedural sound design for footsteps, wind, cavern bumps, arrow releases, monster screams, gold jingling, and victory fanfares.
- **🗺️ Multiple Cavern Presets**:
  - **Classic AIMA**: Standard 4x4 configuration from Russell & Norvig.
  - **Enchanted Grove**: 1 Pit beginner-friendly introductory chamber.
  - **Procedural 4x4 / 5x5 / 6x6**: Randomized deep forest labyrinths.
- **🕹️ Playable & Inspectable**:
  - Manual keyboard controls (`Arrow Keys` / `WASD` to move, `Space` to shoot, `G` to grab, `C` to climb).
  - God Mode toggle to reveal full cavern layout.
  - Real-time expedition action log and performance scoring.

---

## 🎮 How to Play

### Objectives
1. Navigate the grid from `(0, 0)` without falling into bottomless **Pits** or encountering the **Wumpus**.
2. Identify clues:
   - **Breeze (💨)** indicates an adjacent Pit.
   - **Stench (👃)** indicates an adjacent Wumpus.
   - **Glitter (✨)** indicates Gold in the current cell.
   - **Scream (😱)** echoes across the cavern if the Wumpus is slain by an arrow.
3. Grab the **Gold (🪙)** and return safely to the starting tile `(0, 0)` to climb out victorious!

### Controls
| Key / Button | Action |
|---|---|
| `W` / `↑` | Move North / Up |
| `S` / `↓` | Move South / Down |
| `A` / `←` | Move West / Left |
| `D` / `→` | Move East / Right |
| `Space` | Shoot Arrow in current facing direction |
| `G` | Grab Gold |
| `C` | Climb Ladder (at start tile `(0, 0)`) |
| `P` | Step AI Agent |
| `O` | Toggle AI Overlay |
| `M` | Mute / Unmute Audio |

---

## 🚀 Getting Started

No build tools, bundlers, or package installations required!

### Option 1: Direct in Browser
Simply open `index.html` in any modern web browser.

### Option 2: Local HTTP Server (Node.js)
```bash
node server.js
```
Then visit `http://localhost:3000` in your browser.

### Option 3: Python HTTP Server
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

---

## 📁 Project Structure

```
wumpus-world/
├── index.html       # Single-page interface layout and controls
├── styles.css       # Responsive dark-fantasy styling and animations
├── game.js          # Core Wumpus World environment state and game rules
├── ai_agent.js      # Propositional logic inference engine and autonomous solver
├── ui.js            # DOM renderer, particle system, and event handlers
├── audio.js         # Procedural Web Audio API sound generator
├── server.js        # Lightweight Node.js local static server
├── assets/          # High-resolution art assets (banners, portraits)
└── README.md        # Documentation
```

---

## 📜 License

This project is licensed under the MIT License.
