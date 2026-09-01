/**
 * JAIJITESH.OS — CANONICAL PORTFOLIO DATA ARCHITECTURE
 * Centralized Single Source of Truth for all Systems (3D Bench, OS Desktop, Explorer, Terminal, Timeline)
 */

export const IDENTITY = {
  name: 'Jaijitesh Suryaprakash',
  handle: 'BerrF35',
  university: 'Vellore Institute of Technology (VIT Vellore)',
  degree: 'B.Tech Information Technology',
  cohort: '2025 – 2029',
  location: 'Vellore, Tamil Nadu, India (+05:30 IST)',
  email: 'jaijiteshsp@gmail.com',
  phone: '+91 9940970749',
  github: 'https://github.com/BerrF35',
  linkedin: 'https://linkedin.com/in/jaijitesh-suryaprakash-j',
  portraitImage: 'assets/images/profile/portrait_full_body.jpg',
  tagline: 'Personal Operating Environment disguised as a minimalist engineering portfolio.',
  summary: 'Systems thinker, scientific programmer, and robotics builder. Focused on real-time Lattice Boltzmann Method (LBM) CFD fluid simulation, local-first agentic systems with OS automation, closed-loop ESP32 motor kinematics, and edge computer vision.',
  pillars: [
    {
      title: 'Scientific Simulation & CFD',
      desc: 'Real-time Lattice Boltzmann Method (LBM D2Q9) aerodynamic solvers running 60 FPS in WebGL.',
      tag: 'SIMULATION'
    },
    {
      title: 'Autonomous Robotics',
      desc: 'SolidWorks CAD mechanical chassis, 20kHz FreeRTOS motor control loops, optical odometry, and S-curve profiling.',
      tag: 'ROBOTICS'
    },
    {
      title: 'Local-First AI Agents',
      desc: 'Air-gapped on-device desktop assistants with Computer-Use Automation (CUA), vector memory, and tooling.',
      tag: 'AGENTS'
    },
    {
      title: 'Edge Vision & Perception',
      desc: 'Low-latency computer vision pipelines optimized for low-power ARM microcontrollers and Raspberry Pi.',
      tag: 'PERCEPTION'
    }
  ],
  interests: [
    'Lattice Boltzmann Method (LBM)',
    'Computational Fluid Dynamics (CFD)',
    'SolidWorks CAD & Mechanical Engineering',
    'ESP32 FreeRTOS Firmware & 20kHz PWM',
    'Closed-Loop Motor PID & Odometry',
    'Local LLMs & Computer-Use Automation',
    'Astronomy, Rockets & Astronomical Optics',
    'Analog Camera Optics & Spectral Imaging'
  ]
};

export const PROJECTS = {
  windsim: {
    id: 'windsim',
    title: 'WindSim',
    subtitle: 'Browser-Native LBM CFD Aerodynamics Platform',
    category: 'Computational Physics & Aerodynamics',
    badge: 'BEST WORK // FLAGSHIP',
    year: '2025 – 2026',
    role: 'Sole Creator & Lead Engineer',
    team: 'Solo Project',
    status: 'Active Production / Live',
    github: 'https://github.com/BerrF35/Windsim',
    demo: 'https://berrf35.github.io/Windsim/',
    summary: 'A real-time, browser-native 2D computational fluid dynamics aerodynamic analysis platform powered by the discrete Lattice Boltzmann Method (LBM D2Q9). Designed for interactive aerodynamic research, boundary layer separation visualization, and NACA airfoil coefficient analysis (C_L, C_D, L/D).',
    problem: 'Traditional Navier-Stokes CFD solvers (e.g. OpenFOAM, ANSYS Fluent) are computationally heavy, non-interactive, and run on offline clusters, creating high latency in early aerodynamic concept iteration and intuition building.',
    solution: 'Designed a real-time, browser-native 2D Lattice Boltzmann CFD platform using the discrete D2Q9 lattice velocity discretization with BGK (Bhatnagar-Gross-Krook) single-relaxation-time collision operator, achieving deterministic 60 FPS aerodynamics analysis directly in WebGL.',
    contribution: 'Wrote the complete LBM D2Q9 streaming & collision solver from scratch in JavaScript/GLSL, formulated Zou-He velocity and open boundary conditions, implemented NACA 4-digit airfoil geometry generators, and created real-time particle streamline and dynamic pressure visualization.',
    technologies: ['JavaScript (ES Modules)', 'WebGL 2.0 / GLSL', 'HTML5 Canvas', 'LBM D2Q9 BGK', 'Zou-He Boundary Conditions', 'Numerical Physics'],
    architecture: [
      {
        name: 'D2Q9 Velocity Discretization',
        detail: 'Simulates fluid distribution functions $f_0 \\dots f_8$ across 9 discrete velocity vectors on a 2D Cartesian lattice mesh.'
      },
      {
        name: 'BGK Collision Operator',
        detail: 'Relaxes particle distributions toward local Maxwell-Boltzmann equilibrium f_i^eq governed by kinematic viscosity parameter $\\tau$.'
      },
      {
        name: 'Zou-He & Bounce-Back Boundaries',
        detail: 'Exact bounce-back boundary collisions for solid obstacle airfoils; Zou-He velocity boundaries at inlet; open anti-reflective pressure boundaries at outlet.'
      },
      {
        name: 'Aerodynamic Coefficient Extraction',
        detail: 'Integrates surface momentum exchange to calculate real-time Lift Coefficient (C_L), Drag Coefficient (C_D), and aerodynamic efficiency (L/D).'
      }
    ],
    specs: [
      ['SOLVER', 'Lattice Boltzmann Method (LBM) D2Q9'],
      ['COLLISION', 'Single-Relaxation-Time BGK (1/τ)'],
      ['COMPUTE', 'WebGL 2.0 / GPU Accelerated Canvas'],
      ['TARGETS', 'NACA 0012, NACA 2412, Cylinders, Custom'],
      ['FRAME RATE', '60 FPS Real-Time Deterministic'],
      ['METRICS', 'Re, Dynamic Pressure q, $C_L$, $C_D$, $L/D$'],
      ['SOURCE', 'GitHub (BerrF35/Windsim)']
    ],
    images: [
      {
        url: 'assets/images/projects/windsim/overview.png',
        caption: 'WindSim Primary Simulation Interface with NACA Airfoil in Airflow Tunnel'
      },
      {
        url: 'assets/images/projects/windsim/streamlines.png',
        caption: 'Real-Time Particle Streamlines and Velocity Vector Topology'
      },
      {
        url: 'assets/images/projects/windsim/pressure_field.png',
        caption: 'Dynamic Pressure Gradient Distribution across Airfoil Upper & Lower Surfaces'
      },
      {
        url: 'assets/images/projects/windsim/vorticity.png',
        caption: 'Vorticity Curl and Boundary Layer Wake Detachment'
      },
      {
        url: 'assets/images/projects/windsim/airfoil_slice.png',
        caption: 'Parametric Airfoil Geometry Generation & Grid Discretization'
      },
      {
        url: 'assets/images/projects/windsim/controls.png',
        caption: 'Aerodynamic Parameter Controls: Angle of Attack, Wind Speed, Viscosity'
      }
    ]
  },

  berry: {
    id: 'berry',
    title: 'Berry AI',
    subtitle: 'Local-First Desktop AI Assistant & OS Automation Sidecar',
    category: 'Autonomous Agents & Local Systems',
    badge: 'LOCAL-FIRST // AIR-GAPPED',
    year: '2025 – 2026',
    role: 'Sole Creator & System Architect',
    team: 'Solo Project',
    status: 'Active Development',
    github: 'https://github.com/BerrF35/Berry',
    demo: null,
    summary: 'An air-gapped, local-first Python desktop assistant featuring Computer-Use Automation (CUA), persistent multi-turn vector memory, semantic tooling orchestration, and browser control relay with zero telemetry.',
    problem: 'Cloud-dependent AI assistants introduce high API latency, severe data privacy vulnerabilities, and lack native integration with local operating system windows, file systems, and CLI tools.',
    solution: 'Built an open-source, local-first Python desktop agent that runs quantized LLMs on-device (Ollama / Llama.cpp), orchestrates system tools via sub-processes, manages persistent semantic context in SQLite/ChromaDB, and automates OS tasks through CUA (Computer-Use Automation).',
    contribution: 'Designed the four-pillar agent pipeline (Core Engine, Berry CUA, Browser Relay, Berry Vault), implemented the ReAct multi-step planning loop, built local vector embeddings storage, and engineered shell/file automation relays.',
    technologies: ['Python 3.11', 'Ollama / Llama.cpp', 'ChromaDB', 'SQLite', 'FastAPI', 'WebSockets', 'AGPL-3.0'],
    architecture: [
      {
        name: '01 // Central Engine',
        detail: 'Local LLM orchestrator running quantized models on-device with sub-50ms token dispatch and multi-step tool reasoning.'
      },
      {
        name: '02 // Berry CUA (Computer-Use)',
        detail: 'Direct OS interaction sidecar capable of file editing, shell command execution, window inspection, and GUI automation.'
      },
      {
        name: '03 // Browser Relay',
        detail: 'Headless Chromium bridge for live web scraping, documentation indexing, and online research collation.'
      },
      {
        name: '04 // Berry Vault',
        detail: 'Persistent local vector memory storing developer interaction logs and codebase knowledge embeddings with hybrid search.'
      }
    ],
    specs: [
      ['ARCHITECTURE', 'Local-First Autonomous ReAct Agent Loop'],
      ['INFERENCE', 'On-Device Quantized LLMs via Ollama / Llama.cpp'],
      ['MEMORY', 'SQLite + ChromaDB Persistent Vector Vault'],
      ['AUTOMATION', 'Berry CUA (OS Shell / FS / Window Relay)'],
      ['PRIVACY', '100% Air-Gapped / Zero External Telemetry'],
      ['LICENSE', 'GNU Affero General Public License (AGPL-3.0)']
    ],
    images: [
      {
        url: 'assets/images/projects/berry_ai/hero.png',
        caption: 'Berry AI Local Assistant Interface & Real-Time Tool Execution Graph'
      }
    ]
  },

  berrybot: {
    id: 'berrybot',
    title: 'BerryBot',
    subtitle: 'Tracked Autonomous Robotics Platform',
    category: 'Autonomous Robotics & Embedded Systems',
    badge: 'HARDWARE BUILD // SOLIDWORKS CAD',
    year: '2025 – 2026',
    role: 'Mechanical Designer & Firmware Engineer',
    team: 'Solo Project',
    status: 'Operational Hardware Prototype',
    github: 'https://github.com/BerrF35',
    demo: null,
    summary: 'A high-speed tracked autonomous ground robot designed and built from SolidWorks CAD down to custom 20kHz FreeRTOS motor firmware on a dual-core ESP32, featuring optical quadrature encoders, S-curve jerk-limited velocity profiling, and Raspberry Pi 4 edge compute.',
    problem: 'High-speed tracked ground vehicles experience track slip, nonlinear friction, and motor deadbands that cause rapid open-loop drift and poor trajectory following in autonomous navigation.',
    solution: 'Engineered a complete tracked robotics platform from SolidWorks CAD down to custom 20kHz FreeRTOS motor firmware on a dual-core ESP32, incorporating optical quadrature encoders, S-curve jerk-limited velocity profiling, and closed-loop PID odometry.',
    contribution: 'Designed the complete M4 tractor chassis in SolidWorks CAD, fabricated the physical chassis with rubber treads, wrote the dual-core ESP32 FreeRTOS firmware with 20kHz PWM hardware timers, implemented optical odometry and waypoint path tracking, and integrated Raspberry Pi 4 edge perception.',
    technologies: ['SolidWorks CAD', 'ESP32-WROOM-32 (240MHz)', 'C++ / FreeRTOS', '20kHz PWM Hardware Timers', 'Optical Quadrature Encoders', 'Raspberry Pi 4', 'Closed-Loop PID', 'S-Curve Profiling'],
    architecture: [
      {
        name: 'Mechanical & CAD Assembly',
        detail: 'Custom SolidWorks CAD M4 tractor chassis with low ground pressure, high-traction rubber treads, reinforced idlers, and modular electronics bays.'
      },
      {
        name: 'Dual-Core ESP32 Firmware',
        detail: 'Core 0 runs 20kHz motor PWM generation and hardware PCNT encoder counting; Core 1 executes S-curve trajectory profiling and telemetry streaming.'
      },
      {
        name: 'S-Curve Trajectory Profiling',
        detail: 'Jerk-limited acceleration curves (d³x/dt³) eliminate track slip, reduce gear wear, and prevent sudden current spikes during speed transitions.'
      },
      {
        name: 'Closed-Loop Odometry & RTH',
        detail: 'Dual optical quadrature encoders provide real-time (x, y, θ) pose estimation with closed-loop heading PID and autonomous Return-to-Home (RTH).'
      }
    ],
    specs: [
      ['CHASSIS', 'SolidWorks M4 High-Speed Tracked Tractor'],
      ['CONTROLLER', 'ESP-WROOM-32 (Dual-Core Xtensa 240MHz)'],
      ['MOTOR CONTROL', 'Dual H-Bridge with 20kHz PWM Hardware Timers'],
      ['FEEDBACK', 'Optical Quadrature Encoders via Hardware PCNT'],
      ['TRAJECTORY', 'S-Curve Jerk-Limited Velocity Profiling + PID'],
      ['EDGE COMPUTE', 'Raspberry Pi 4 Model B (Broadcom BCM2711)'],
      ['CAPABILITIES', 'Waypoint Navigation, Path Tracking, Return-To-Home']
    ],
    images: [
      {
        url: 'assets/images/hardware/berrybot/robot_photo_01.jpg',
        caption: 'Physical BerryBot Tracked Robot Chassis Assembly on Workshop Bench'
      },
      {
        url: 'assets/images/hardware/berrybot/robot_photo_02.jpg',
        caption: 'Side Elevation showing High-Traction Rubber Treads, Drive Sprockets & Suspension'
      },
      {
        url: 'assets/images/hardware/berrybot/robot_photo_03.jpg',
        caption: 'Internal Electronics Deck with ESP32 Controller, Motor Drivers & Power Distribution'
      }
    ]
  },

  impactx: {
    id: 'impactx',
    title: 'ImpactX 3.0',
    subtitle: 'Hyperlocal Dispatch & Real-Time Logistics Platform',
    category: 'Hackathon Award Winner / Distributed Systems',
    badge: '3RD PLACE OVERALL // HACKATHON WINNER',
    year: '2026',
    role: 'Lead Developer & System Architect',
    team: 'Hackathon Team',
    status: '3rd Place Overall Winner',
    github: 'https://github.com/BerrF35',
    demo: null,
    summary: 'A high-throughput geospatial dispatch and real-time logistics routing platform built during the ImpactX 3.0 Hackathon, securing 3rd Place Overall. Features automated batch allocation, dynamic Voronoi partitioning, and WebSocket driver tracking.',
    problem: 'High-density campus and urban delivery networks suffer from suboptimal manual order allocation, high dispatch latency, and inefficient vehicle routing during peak demand spikes.',
    solution: 'Architected a real-time hyperlocal dispatch engine featuring automated batching, dynamic Voronoi-partitioned order allocation, and real-time geospatial route calculation over WebSockets.',
    contribution: 'Architected backend dispatch microservices, wrote the geospatial allocation algorithms, and built the real-time driver tracking WebSocket dashboard under 36-hour hackathon constraints.',
    technologies: ['TypeScript', 'Node.js', 'FastAPI', 'WebSockets', 'Leaflet / MapLibre', 'PostgreSQL / PostGIS'],
    architecture: [
      {
        name: 'Geospatial Dispatch Engine',
        detail: 'Clusters incoming orders geographically in sub-second timeframes and matches them to nearest available couriers using Voronoi partitioning.'
      },
      {
        name: 'Real-Time WebSocket Mesh',
        detail: 'Streams driver telemetry and route progress with bidirectional sub-50ms latency.'
      }
    ],
    specs: [
      ['AWARD', '3rd Place Overall Winner (ImpactX 3.0 Hackathon)'],
      ['ROLE', 'Lead Developer & System Architect'],
      ['PIPELINE', 'Automated Geospatial Batch Allocation & Routing'],
      ['STACK', 'TypeScript, Node.js, WebSockets, PostGIS']
    ],
    images: [
      {
        url: 'assets/images/hackathons/impactx/team.jpg',
        caption: 'ImpactX 3.0 Hackathon Team — 3rd Place Overall Award'
      }
    ]
  },

  farmassist: {
    id: 'farmassist',
    title: 'FarmAssist AI',
    subtitle: 'Edge Computer Vision Agricultural Disease Diagnostics',
    category: 'Hackathon / Edge Computer Vision',
    badge: 'YANTRA 26 CENTRAL HACK',
    year: '2026',
    role: 'Lead Developer & Model Engineer',
    team: 'Hackathon Team',
    status: 'Central Hackathon Submission',
    github: 'https://github.com/BerrF35',
    demo: null,
    summary: 'An edge-deployable computer vision diagnostic system that classifies agricultural leaf pathologies in offline environments using quantized lightweight CNN models on low-power Raspberry Pi edge hardware.',
    problem: 'Smallholder farmers lack immediate access to agricultural pathologists, resulting in delayed pest/fungal identification and severe crop yield losses.',
    solution: 'Developed an edge-deployable computer vision diagnostic system that classifies leaf pathologies in offline environments using quantized lightweight CNN models on edge hardware.',
    contribution: 'Trained and quantized the crop disease classification model for low-latency edge inference on Raspberry Pi, designed the camera capture pipeline, and built the diagnostic UI.',
    technologies: ['Python', 'PyTorch', 'OpenCV', 'MobileNetV3 / ONNX Runtime', 'Raspberry Pi 4', 'Flask'],
    architecture: [
      {
        name: 'Edge Vision Pipeline',
        detail: 'Captures leaf samples via CSI camera module, performs optical contrast normalization, and runs INT8-quantized neural inference in <120ms.'
      },
      {
        name: 'Offline Field Diagnostic Interface',
        detail: 'Local web interface running directly from the Raspberry Pi access point without requiring cloud connectivity.'
      }
    ],
    specs: [
      ['EVENT', 'Yantra 26 Central Hackathon'],
      ['ROLE', 'Lead Developer & Model Engineer'],
      ['INFERENCE', 'INT8 Quantized MobileNet on Raspberry Pi 4'],
      ['DIAGNOSTICS', 'Multi-Class Foliar Pathology Classification']
    ],
    images: [
      {
        url: 'assets/images/hackathons/yantra/team.jpg',
        caption: 'FarmAssist AI Development Team at Yantra 26 Central Hackathon'
      }
    ]
  },

  vinhack: {
    id: 'vinhack',
    title: 'VinHack 25',
    subtitle: 'Peer-to-Peer Academic Resource & Book Exchange Network',
    category: 'Hackathon / Distributed Systems',
    badge: 'VINHACK 25',
    year: '2025',
    role: 'Lead Coder & Backend Architect',
    team: 'Hackathon Team',
    status: 'Hackathon Submission',
    github: 'https://github.com/BerrF35',
    demo: null,
    summary: 'A verified peer-to-peer campus exchange network with authenticated student trust graphs and automated escrow verification to streamline university textbook and hardware circulation.',
    problem: 'Campus academic textbooks and hardware development kits remain idle after semester completions with high frictional resale costs.',
    solution: 'Built a verified peer-to-peer campus exchange network with authenticated student trust graphs and automated escrow exchange verification.',
    contribution: 'Designed the database relational schema, wrote the authentication & escrow state machine, and deployed the production demo.',
    technologies: ['TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'TailwindCSS'],
    architecture: [
      {
        name: 'Escrow State Machine',
        detail: 'Guarantees secure exchange verification between students with double-blind QR token handshake.'
      },
      {
        name: 'Peer Discovery Mesh',
        detail: 'Categorizes academic courses, departments, and specific book editions for instant matching.'
      }
    ],
    specs: [
      ['EVENT', 'VinHack 25 Hackathon'],
      ['ROLE', 'Lead Coder & Backend Architect'],
      ['DOMAIN', 'Peer-to-Peer Distributed Resource Exchange'],
      ['STACK', 'TypeScript, React, Node.js, PostgreSQL']
    ],
    images: [] // Explicitly empty: no images exist for VinHack, layout uses clean typography and architecture diagram
  }
};

export const RESEARCH = {
  colorsplitter: {
    id: 'colorsplitter',
    title: 'Spectral Color Splitter',
    subtitle: 'Optical Color-Space Image Decomposition & Spectral Filtering',
    status: 'Research System // Paper in Preparation',
    category: 'Computer Vision & Optical Sensing',
    group: 'Academic Research Group with Faculty',
    abstract: 'Investigates computational color-space transformation algorithms (RGB → CIELAB, HSV, and discrete multi-band spectral decomposition) for high-contrast feature isolation, edge perception, and optical segmentation in noise-corrupted imagery.',
    method: 'Formulates multi-spectral channel isolation matrices with adaptive gradient thresholding across optical wavelengths, enabling robust segmentation under variable illumination conditions.',
    findings: 'Demonstrates improved feature isolation boundaries for edge robotic cameras and optical perception compared to raw RGB thresholding.',
    specs: [
      ['DOMAINS', 'Optical Sensing, Color-Space Decomposition, Image Filtering'],
      ['STATUS', 'Experimental Validation & Manuscript in Preparation'],
      ['AFFILIATION', 'Academic Research Group with Faculty Professor'],
      ['SOURCE ASSET', 'Research UI and Spectral Band Analysis Suite']
    ],
    images: [
      {
        url: 'assets/images/research/colorsplitter/ui.png',
        caption: 'Spectral Color Splitter Image Analysis, Chromatic Decomposition & Filter Suite'
      }
    ]
  },

  synthetic_data: {
    id: 'synthetic_data',
    title: 'Synthetic Training Data Pipeline',
    subtitle: 'Parametric Scene Synthesis for Robust Edge Vision Classifiers',
    status: 'Paper in Preparation (Faculty Research Group)',
    category: 'Computer Vision & Synthetic Datasets',
    group: '5-Person Academic Research Group with Professor',
    abstract: 'Explores domain randomization and procedural synthetic data generation pipelines to train robust edge perception classifiers with minimal manual annotation overhead.',
    method: 'Implements parametric lighting variation, randomized material PBR properties, camera distortion modeling, and automated ground-truth bounding box / semantic mask generation.',
    findings: 'Synthetically trained lightweight models achieve competitive mAP scores when fine-tuned on target edge domains.',
    specs: [
      ['GROUP', '5-Person Academic Research Group with Faculty Professor'],
      ['TOPIC', 'Procedural 3D Dataset Generation & Domain Adaptation'],
      ['STATUS', 'Active Experimentation & Manuscript Preparation'],
      ['TARGET', 'Edge Computer Vision & Robotics Autonomy']
    ],
    images: [] // No fake images: typography and pipeline architecture diagram
  },

  edge_vision: {
    id: 'edge_vision',
    title: 'Edge Vision Systems on Low-Power MCUs',
    subtitle: 'Embedded Computer Vision Algorithms for Constrained ARM Microcontrollers',
    status: 'Research Investigation',
    category: 'Embedded Perception & Firmware',
    group: 'Academic Research Group with Faculty',
    abstract: 'Investigates sub-50ms optical flow, lightweight edge filtering, and low-latency spatial feature extraction running directly within memory-constrained microcontroller architectures.',
    method: 'Optimized integer-arithmetic spatial convolution kernels running on ARM Cortex-M / FreeRTOS hardware with zero dynamic memory allocation.',
    findings: 'Enables real-time obstacle avoidance and visual odometry on sub-watt embedded hardware nodes.',
    specs: [
      ['DOMAINS', 'Embedded Perception, ARM Microcontrollers, FreeRTOS'],
      ['STATUS', 'Algorithm Optimization & Hardware Profiling'],
      ['APPLICATIONS', 'Autonomous Robotics & Edge Diagnostics']
    ],
    images: [] // No fake images
  }
};

export const HARDWARE_DEFINITIONS = {
  robot: {
    id: 'robot',
    file: 'assets/chassis.glb',
    title: 'BERRYBOT // TRACKED ROBOTICS PLATFORM',
    eyebrow: 'PHYSICAL 3D MODEL // SOLIDWORKS CAD ASSEMBLY',
    category: 'AUTONOMOUS ROBOTICS',
    summary: 'A tracked autonomous robotics platform designed and built entirely by Jaijitesh around a dual-core ESP32 controller. Features optical quadrature encoders, 20kHz PWM H-bridge drivers, S-curve trajectory profiling, telemetry, path tracking, and return-to-home capabilities.',
    specs: [
      ['CONTROLLER', 'ESP-WROOM-32 (Dual-Core 240MHz)'],
      ['KINEMATICS', 'Differential Track Drive w/ S-Curve Smoothing'],
      ['FEEDBACK', 'Optical Quadrature Encoders + Telemetry Loop'],
      ['CAPABILITIES', 'Path Tracking, Return-To-Home, Closed-Loop PID'],
      ['EDGE COMPUTE', 'Raspberry Pi 4 Model B (Vision Coordinator)'],
      ['SOURCE', 'SolidWorks CAD Assembly (TV_ensemble / M4)']
    ],
    scale: 0.44,
    isGroundedOnFloor: false,
    benchPosition: { x: -0.82, y: 0.80, z: 0.05 },
    benchRotation: { x: 0, y: 0.35, z: 0 },
    projectId: 'berrybot'
  },

  raspberry: {
    id: 'raspberry',
    file: 'assets/raspberry.glb',
    title: 'RASPBERRY PI 4 // MODEL B',
    eyebrow: 'PHYSICAL 3D MODEL // SINGLE-BOARD COMPUTER',
    category: 'EDGE COMPUTE NODE',
    summary: 'High-performance edge computational node for on-board autonomous robot processing, local vision pipeline orchestration, and system telemetry logging.',
    specs: [
      ['SOC', 'Broadcom BCM2711 Quad-core Cortex-A72 @ 1.5GHz'],
      ['MEMORY', '4GB LPDDR4-3200 SDRAM'],
      ['IO PORTS', '2x USB 3.0, 2x USB 2.0, Gigabit Ethernet, Dual Micro-HDMI'],
      ['GPIO', 'Standard 40-Pin Header (I2C, SPI, UART, PWM)'],
      ['ROLE', 'Edge Vision & High-Level Autonomy Coordinator']
    ],
    scale: 0.14,
    isGroundedOnFloor: false,
    benchPosition: { x: 0.44, y: 0.80, z: -0.18 },
    benchRotation: { x: 0, y: -0.25, z: 0 }
  },

  esp32: {
    id: 'esp32',
    file: 'assets/esp32.glb',
    title: 'ESP32-WROOM // DUAL-CORE MICROCONTROLLER',
    eyebrow: 'PHYSICAL 3D MODEL // EMBEDDED HARDWARE',
    category: 'MICROCONTROLLER & MOTOR CONTROL',
    summary: 'High-speed 240MHz dual-core embedded processor driving low-latency motor control loops, real-time optical encoder counting, and hardware sensor telemetry.',
    specs: [
      ['MCU', 'ESP-WROOM-32 (Tensilica Xtensa Dual-Core 240MHz)'],
      ['TIMING', 'Hardware Timers for 20kHz Motor PWM Generation'],
      ['PULSE COUNT', 'Hardware PCNT Peripheral for Encoder Ranging'],
      ['CONNECTIVITY', '2.4 GHz Wi-Fi & Bluetooth v4.2 BR/EDR/BLE'],
      ['ROLE', 'Low-Level Real-Time Motor & Sensor Controller']
    ],
    scale: 0.12,
    isGroundedOnFloor: false,
    benchPosition: { x: 0.76, y: 0.80, z: -0.15 },
    benchRotation: { x: 0, y: 0.15, z: 0 }
  },

  camera: {
    id: 'camera',
    file: 'assets/canon_at-1_retro_camera.glb',
    title: 'CANON AT-1 // 35MM RETRO OPTICS',
    eyebrow: 'PHYSICAL 3D MODEL // COMPUTER VISION & SENSING',
    category: 'OPTICAL SENSING PROP',
    summary: 'Retro 35mm SLR optical camera body representing computer vision, photogrammetry data synthesis pipelines, and spectral chromaticity research.',
    specs: [
      ['MOUNT', 'Canon FD Bayonet System'],
      ['ROLE', 'Optical Perception & Image Processing Asset'],
      ['SHUTTER', 'Focal-Plane Electronic Shutter'],
      ['RESEARCH LINK', 'Spectral Color-Space & Data Generation']
    ],
    scale: 0.16,
    isGroundedOnFloor: false,
    benchPosition: { x: -0.46, y: 0.80, z: 0.28 },
    benchRotation: { x: 0, y: 0.45, z: 0 }
  },

  telescope: {
    id: 'telescope',
    file: 'assets/telescope.glb',
    title: 'REFRACTOR TELESCOPE // ASTRONOMICAL OPTICS',
    eyebrow: 'PERSONALITY PROP // SCIENTIFIC CURIOSITY',
    category: 'SPACE & ASTRONOMICAL INTERESTS',
    summary: 'Precision equatorial refractor telescope standing right beside the workbench, symbolizing celestial observation, rockets, mathematical systems, and scientific curiosity.',
    specs: [
      ['OPTICS', 'Achromatic Refractor Objective Lens'],
      ['MOUNT', 'Heavy-Duty Equatorial Tripod with Setting Circles'],
      ['SIGNIFICANCE', 'Personal curiosity in space, astrophysics & rocket systems'],
      ['TYPE', 'Personality Prop (Not a formal portfolio project)']
    ],
    scale: 1.55,
    isGroundedOnFloor: true,
    benchPosition: { x: 1.48, y: 0, z: 0.55 },
    benchRotation: { x: 0, y: -0.55, z: 0 }
  },

  dog: {
    id: 'dog',
    file: 'assets/full_body_shepherd_dog_meshy.glb',
    title: 'BERRY // PET DOG',
    eyebrow: 'EASTER EGG // BERRY',
    category: 'COMPANION',
    summary: 'Berry the loyal Belgian Malinois resting beside the engineering lab bench.',
    specs: [
      ['BREED', 'Belgian Malinois'],
      ['NAME', 'Berry'],
      ['STATUS', 'Chief Morale Officer & Lab Companion']
    ],
    scale: 0.85,
    isGroundedOnFloor: true,
    benchPosition: { x: -1.48, y: 0, z: 0.70 },
    benchRotation: { x: 0, y: 0.55, z: 0 }
  },

  cat: {
    id: 'cat',
    file: 'assets/3d_modelling_my_cat_fripouille.glb',
    title: 'CRISPY // PET CAT',
    eyebrow: 'EASTER EGG // CRISPY',
    category: 'COMPANION',
    summary: 'Crispy the pet cat peacefully resting on the edge of the workbench.',
    specs: [
      ['SPECIES', 'Domestic Cat'],
      ['NAME', 'Crispy'],
      ['STATUS', 'Workbench Supervisor & Nap Specialist']
    ],
    scale: 0.26,
    isGroundedOnFloor: false,
    benchPosition: { x: 0.92, y: 0.80, z: 0.12 },
    benchRotation: { x: 0, y: -0.65, z: 0 }
  }
};

export const TIMELINE_MILESTONES = [
  {
    year: '2026',
    title: 'ImpactX 3.0 Hackathon — 3rd Place Overall',
    category: 'HACKATHONS',
    role: 'Lead Developer & Architect',
    desc: 'Led architecture and development of high-concurrency geospatial dispatch and real-time logistics routing engine over WebSockets.',
    link: 'impactx',
    type: 'project'
  },
  {
    year: '2026',
    title: 'FarmAssist AI — Yantra 26 Central Hackathon',
    category: 'HACKATHONS',
    role: 'Lead Developer',
    desc: 'Built offline edge computer vision agricultural diagnostics pipeline running quantized neural models on Raspberry Pi.',
    link: 'farmassist',
    type: 'project'
  },
  {
    year: '2026',
    title: 'BerryBot — Tracked Robotics & 20kHz FreeRTOS Firmware',
    category: 'ROBOTICS',
    role: 'Mechanical & Firmware Engineer',
    desc: 'Fabricated SolidWorks CAD tracked chassis, implemented ESP32 dual-core 20kHz motor control, optical odometry, and S-curve kinematics.',
    link: 'berrybot',
    type: 'project'
  },
  {
    year: '2025 – 2026',
    title: 'WindSim — Lattice Boltzmann CFD Aerodynamics Platform',
    category: 'SIMULATION',
    role: 'Sole Creator',
    desc: 'Developed real-time browser LBM D2Q9 aerodynamics platform with NACA airfoil analysis and boundary layer visualization.',
    link: 'windsim',
    type: 'project'
  },
  {
    year: '2025 – 2026',
    title: 'Berry AI — Local-First Assistant & OS Sidecar',
    category: 'AGENTS',
    role: 'Sole Creator',
    desc: 'Created air-gapped on-device desktop assistant with Computer-Use Automation (CUA), vector memory vault, and browser relay.',
    link: 'berry',
    type: 'project'
  },
  {
    year: '2025 – 2026',
    title: 'Academic Research Group — 3 Papers in Preparation',
    category: 'RESEARCH',
    role: 'Research Co-Author',
    desc: 'Collaborating on 3 research manuscripts with faculty group on synthetic data generation, spectral color decomposition, and edge vision.',
    link: 'Research',
    type: 'folder'
  },
  {
    year: '2025',
    title: 'VinHack 25 — Peer-to-Peer Academic Exchange',
    category: 'HACKATHONS',
    role: 'Lead Coder',
    desc: 'Built decentralized campus resource and textbook exchange protocol with escrow state verification.',
    link: 'vinhack',
    type: 'project'
  },
  {
    year: '2025',
    title: 'B.Tech Information Technology — VIT Vellore',
    category: 'EDUCATION',
    role: 'Undergraduate Student',
    desc: 'Commenced B.Tech in Information Technology at Vellore Institute of Technology (VIT Vellore, 2025–2029).',
    link: 'about',
    type: 'file'
  }
];

export const VIRTUAL_FILESYSTEM = {
  'Desktop': {
    title: 'Desktop',
    path: 'C:\\Users\\Jaijitesh\\Desktop',
    items: [
      { id: 'projects', name: 'Projects', type: 'folder', target: 'Projects', iconType: 'folder', desc: 'Engineering & Hackathon Projects Folder', size: 'DIR' },
      { id: 'research', name: 'Research', type: 'folder', target: 'Research', iconType: 'folder', desc: 'Academic Research Manuscripts & Papers', size: 'DIR' },
      { id: 'hardware', name: 'Hardware 3D', type: 'folder', target: 'Hardware', iconType: 'folder', desc: 'SolidWorks CAD & 3D Hardware Models', size: 'DIR' },
      { id: 'about', name: 'About_Dossier.txt', type: 'file', target: 'about', iconType: 'txt', desc: 'Jaijitesh Personnel Dossier & Contact', size: '4.8 KB' },
      { id: 'windsim', name: 'WindSim.exe', type: 'app', target: 'windsim', iconType: 'wind', desc: 'Real-Time LBM CFD Aerodynamics Platform', size: '4.2 MB' },
      { id: 'berry', name: 'BerryAI.exe', type: 'app', target: 'berry', iconType: 'ai', desc: 'Local Desktop AI Assistant & CUA Sidecar', size: '12.8 MB' },
      { id: 'berrybot', name: 'BerryBot.exe', type: 'app', target: 'berrybot', iconType: 'robot', desc: 'Tracked Autonomous Robotics Controller', size: '6.1 MB' },
      { id: 'terminal', name: 'Command_Prompt.cmd', type: 'app', target: 'terminal', iconType: 'cmd', desc: 'Engineering Workstation Shell Interface', size: '512 KB' },
      { id: 'timeline', name: 'Projects_Timeline.exe', type: 'app', target: 'timeline', iconType: 'game', desc: 'Chronological Milestones & Project Directory', size: '2.4 MB' },
      { id: 'contact', name: 'Contact_Dispatch.exe', type: 'app', target: 'contact', iconType: 'mail', desc: 'Direct Communication & Dispatch Interface', size: '1.8 MB' },
      { id: 'recycle', name: 'Recycle Bin', type: 'folder', target: 'RecycleBin', iconType: 'trash', desc: 'System Trash & Deleted Files', size: 'DIR' }
    ]
  },
  'Projects': {
    title: 'Projects',
    path: 'C:\\Users\\Jaijitesh\\Desktop\\Projects',
    items: [
      { id: 'windsim', name: 'WindSim_CFD.exe', type: 'app', target: 'windsim', iconType: 'wind', desc: 'Real-Time LBM CFD Aerodynamics Platform (Flagship)', size: '4.2 MB' },
      { id: 'berry', name: 'Berry_AI_Assistant.exe', type: 'app', target: 'berry', iconType: 'ai', desc: 'Local Desktop Agent (Python / AGPL-3.0)', size: '12.8 MB' },
      { id: 'berrybot', name: 'BerryBot_Robotics.exe', type: 'app', target: 'berrybot', iconType: 'robot', desc: 'Tracked Autonomous Robotics Controller & CAD', size: '6.1 MB' },
      { id: 'impactx', name: 'ImpactX_3.0_Winner.txt', type: 'doc', target: 'impactx', iconType: 'txt', desc: 'Hackathon 3rd Place Overall (Lead Developer)', size: '3.4 KB' },
      { id: 'farmassist', name: 'FarmAssist_AI.txt', type: 'doc', target: 'farmassist', iconType: 'txt', desc: 'Yantra 26 Central Hackathon (Lead Developer)', size: '3.1 KB' },
      { id: 'vinhack', name: 'VinHack_25_Exchange.txt', type: 'doc', target: 'vinhack', iconType: 'txt', desc: 'P2P Academic Resource Exchange (Lead Coder)', size: '2.8 KB' }
    ]
  },
  'Research': {
    title: 'Research',
    path: 'C:\\Users\\Jaijitesh\\Desktop\\Research',
    items: [
      { id: 'res_color', name: 'Spectral_Color_Splitter.pdf', type: 'doc', target: 'res_color', iconType: 'pdf', desc: 'Spectral color-space image analysis algorithms (UI Verified)', size: '920 KB' },
      { id: 'res_synth', name: 'Synthetic_Data_Generator.pdf', type: 'doc', target: 'res_synth', iconType: 'pdf', desc: 'Parametric scene synthesis for edge classifiers (with faculty)', size: '1.4 MB' },
      { id: 'res_vision', name: 'Edge_Vision_Systems.pdf', type: 'doc', target: 'res_vision', iconType: 'pdf', desc: 'Low-power ARM vision integration on microcontrollers', size: '2.1 MB' }
    ]
  },
  'Hardware': {
    title: 'Hardware 3D',
    path: 'C:\\Users\\Jaijitesh\\Desktop\\Hardware 3D',
    items: [
      { id: 'cad_chassis', name: 'BerryBot_Chassis.step', type: 'cad', target: 'robot', iconType: 'cad', desc: 'SolidWorks M4 High-Speed Tracked Chassis Assembly', size: '3.8 MB' },
      { id: 'cad_rpi', name: 'Raspberry_Pi_4_Model_B.step', type: 'cad', target: 'raspberry', iconType: 'cad', desc: 'BCM2711 4-Core Quad 64-bit Compute Board', size: '5.9 MB' },
      { id: 'cad_esp', name: 'ESP32_WROOM_38Pin.step', type: 'cad', target: 'esp32', iconType: 'cad', desc: 'Dual-Core Controller with 20kHz Motor PWM', size: '6.2 MB' },
      { id: 'cad_camera', name: 'Canon_AT1_Retro.cad', type: 'cad', target: 'camera', iconType: 'cad', desc: 'Canon AT-1 35mm Vintage SLR & Perception Optics', size: '19.5 MB' },
      { id: 'cad_telescope', name: 'Refractor_Telescope.cad', type: 'cad', target: 'telescope', iconType: 'cad', desc: 'Scientific Refractor & Equatorial Mount Prop', size: '6.6 MB' }
    ]
  },
  'RecycleBin': {
    title: 'Recycle Bin',
    path: 'Recycle Bin',
    items: [
      { id: 'junk_logs', name: 'previous_build_logs.log', type: 'doc', target: 'junk_logs', iconType: 'trash', desc: '14 KB (Deleted)', size: '14 KB' },
      { id: 'junk_temp', name: 'temp_debug_dump.tmp', type: 'doc', target: 'junk_temp', iconType: 'trash', desc: '28 KB (Deleted)', size: '28 KB' }
    ]
  }
};
