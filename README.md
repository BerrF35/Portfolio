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
│   │
│   ├── core/                   # 3D Graphics & Engine Foundation
│   │   ├── scene.js            # Three.js setup, studio lighting, camera choreography, orbit constraints
│   │   ├── desk.js             # Chamfered oak workbench & topographic elevation contour desk mat
│   │   ├── audio.js            # Web Audio API procedural synthesizer
│   │   └── state.js            # Reactive application state & GPU offload management
│   │
│   ├── hardware/               # 3D Hardware CAD & Telemetry
│   │   ├── cadLoader.js        # GLTF loader, PBR materials, centering wrappers, and positioning
│   │   └── definitions.js      # Technical telemetry definitions (Robot, Pi, ESP32, Camera, Telescope, Pets)
│   │
│   ├── os/                     # JAIJITESH.OS Operating Environment
│   │   ├── desktop.js          # Window manager, dock, taskbar, theme system, application routing
│   │   ├── terminal.js         # Interactive UNIX CLI shell with real facts & commands
│   │   └── pixelGame.js        # High-DPI retro pixel memory timeline world & animated companions
│   │
│   ├── apps/                   # Interactive Simulation & Engineering Apps
│   │   ├── simRobot.js         # BerryBot autonomous robotics telemetry & S-curve kinematics sandbox
│   │   ├── simWind.js          # WindSim aerodynamics LBM CFD simulation sandbox
│   │   └── simAgent.js         # Berry local-first desktop AI assistant architecture visualizer
│   │
│   └── styles/                 # Modular CSS Architecture
│       ├── main.css            # Root tokens, Swiss typography, minimal entry surface, HUD
│       ├── desktop.css         # JAIJITESH.OS window manager, dock, taskbar, theme variables
│       └── apps.css            # Simulators, telemetry cards, inspector overlay, pixel timeline
│
├── assets/                     # 3D CAD & binary models
│   ├── chassis.glb             # BerryBot tracked robotics platform
│   ├── raspberry.glb           # Raspberry Pi 4 Model B
│   ├── esp32.glb               # ESP32-WROOM microcontroller
│   ├── hp_omen_laptop.glb      # Engineering Workstation 16
│   ├── ice_claw_mouse.glb      # Precision CAD mouse
│   ├── full_body_shepherd_dog_meshy.glb # Berry (12yo Belgian Malinois)
│   ├── 3d_modelling_my_cat_fripouille.glb # Crispy (10yo Companion Cat)
│   ├── canon_at-1_retro_camera.glb # Canon AT-1 retro optics
│   ├── telescope.glb           # Refractor telescope
│   └── cad/                    # Technical engineering STEP CAD archives
│
└── tools/                      # CLI Inspection & Diagnostic Utilities
    ├── inspect_models.py       # GLB node and mesh accessor inspector
    ├── check_dimensions.py     # Bounding box & dimension calculator
    └── start-preview.ps1       # Local PowerShell dev preview server
```

---

## ⚡ Key Systems & Features

1. **3D Engineering Lab Bench (Three.js & WebGL)**:
   - Photorealistic illumination with dark architectural slat acoustic walls.
   - High-resolution Black & White Topographic Contour Line desk mat.
   - Real 3D CAD models: **BerryBot Tracked Chassis**, **Raspberry Pi 4**, **ESP32-WROOM**, **Canon AT-1 Camera**, **Refractor Telescope**, **Berry the Belgian Malinois**, and **Crispy the Cat**.
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
   - **Interactive CLI Terminal**: Full UNIX shell (`neofetch`, `projects`, `skills`, `research`, `cat`, `inspect`).
   - **Memory World**: Playable high-DPI 2D pixel timeline world with animated companions.

---

## 🚀 Running Locally

```bash
# Start local development server
npm run dev

# Or with Python directly
python -m http.server 4173
```

Visit **`http://127.0.0.1:4173/`** in your browser.
