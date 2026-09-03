# JAIJITESH.OS — Luxury Minimalist Portfolio & Personal Operating Environment

> **Minimalist Surface. Maximalist Interaction.**  
> A personal operating environment disguised as an ultra-clean Swiss engineering portfolio. Built by **Jaijitesh Suryaprakash** (VIT Vellore, B.Tech IT 2025–2029).

---

## 🏗️ Architecture & Folder Structure

```
JAIJITESH.OS/
│
├── index.html                  # Semantic, SEO-optimized production entry point
├── package.json                # Project metadata, npm/vite scripts, metadata
├── README.md                   # System documentation & engineering dossiers
│
├── src/                        # Clean application source code
│   ├── main.js                 # Bootstrapper & lifecycle coordinator
│   ├── core/                   # 3D Graphics & Engine Foundation
│   │   ├── scene.js            # Three.js setup, studio lighting, camera choreography, orbit constraints
│   │   ├── audio.js            # Web Audio API procedural synthesizer
│   │   └── state.js            # Reactive application state & GPU offload management
│   ├── os/                     # JAIJITESH.OS Operating Environment
│   │   ├── desktop.js          # Window manager, dock, taskbar, theme system, application routing
│   │   ├── terminal.js         # Interactive UNIX CLI shell with real facts & commands
│   │   └── pixelGame.js        # High-DPI retro pixel memory timeline world
│   └── styles/                 # Modular CSS Architecture
│       └── main.css            # Root tokens, Swiss typography, minimal entry surface, HUD
├── assets/                     # 3D CAD & binary models
│   └── jaijitesh_room.glb      # Authoritative 3D world scene
└── tools/                      # CLI Inspection & Diagnostic Utilities
```

---

## ⚡ Key Systems & Features

1. **3D Engineering Lab Bench (Three.js & WebGL)**:
   - Photorealistic illumination with authentic room fixtures and area/bar lighting.
   - Single authoritative 3D world scene with authentic workstation, furniture, and exterior cyberpunk city.
   - Real 3D CAD models: **BerryBot Tracked Chassis**, **Raspberry Pi 4**, **ESP32-WROOM**, **Canon AT-1 Camera**, and **Refractor Telescope**.
   - Camera orbit constraints preventing out-of-bounds viewing.

2. **Workstation Zoom & GPU Offloading**:
   - Two-stage cinematic zoom: lid hinges upright ($19.5^\circ$), followed by deep screen fill zoom.
   - Seamless transition into the full-screen **JAIJITESH.OS v2.6** operating environment.
   - Pauses heavy 3D rendering loops during full-screen OS use to save GPU power.

3. **Desktop Operating Environment**:
   - Draggable, resizable, maximizable windows with live dock indicators.
   - Theme switcher (Obsidian Dark, Solar Light, Cyber Matrix).
   - Procedural Web Audio API sound synthesizer for tactile physical feedback.

4. **Integrated Engineering Apps**:
   - **WindSim CFD Lab**: Real-time Lattice Boltzmann Method aerodynamic simulation.
   - **BerryBot Telemetry Sandbox**: ESP32 differential track kinematics, optical encoder counting, S-curve profiling, and Return-to-Home (RTH).
   - **Berry AI Visualizer**: Architecture graph for the local-first desktop agent (`BerrF35/Berry`).
   - **Interactive CLI Terminal**: Full Windows CMD shell (`neofetch`, `dir`, `systeminfo`, `type`, `help`).
   - **Projects Directory**: Detailed technical specifications, solvers breakdown, and direct repository links.

---

## 🚀 Running Locally

```bash
# Start local development server
npm run dev

# Or with Python directly
python -m http.server 4173
```

Visit **`http://127.0.0.1:4173/`** in your browser.
