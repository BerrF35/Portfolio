# Portfolio Rework — Engineering Handoff & Specification

> **Project**: Jaijitesh Suryaprakash (Berry) — Personal Portfolio  
> **Repository**: [https://github.com/BerrF35/Portfolio](https://github.com/BerrF35/Portfolio)  
> **Live Site**: [https://berrf35.github.io/Portfolio/](https://berrf35.github.io/Portfolio/)  
> **GitHub Profile**: [https://github.com/BerrF35](https://github.com/BerrF35)  
> **LinkedIn**: [https://www.linkedin.com/in/jaijitesh/](https://www.linkedin.com/in/jaijitesh/)  
> **Author**: Antigravity Autonomous Engineering Agent  
> **Date**: October 2026 · **Status**: PRODUCTION IMPLEMENTATION COMPLETE  

---

## 1. Executive Design Direction

### 1.1 The Selected Aesthetic: Minimal Editorial Swiss-Tech
The redesign replaces the previous dark-crimson, sci-fi military aesthetic with a **refined, minimal editorial direction** inspired by contemporary creative developer portfolios (Stefan Vitasović 2025, Tarik Karahodžić, Unai Laguarta / Nadres, City of Angels).

Rather than attempting to impress visitors with five simultaneous WebGL effects, heavy 60fps canvas animation, and dense jargon, the portfolio achieves visual authority through:
1. **Typographic Contrast**: Pairing sculptural, bold brutalist grotesque headings (**Syne**) and human text grotesque (**Epilogue**) with an elegant, expressive editorial serif italic (**Newsreader**) and engineered monospace (**Space Mono**), creating a handcrafted, art-directed editorial feel.
2. **Deep Obsidian & Technical Ochre Palette**: A pitch-black/obsidian ground (`#090a0c`) with crisp white text (`#f4f4f6`), warm muted slate labels (`#8c96a5`), and a sharp, disciplined technical amber/gold accent (`#e5a93c`).
3. **Generous Negative Space & Alignment**: Strict Swiss-style grid alignment with clear section cadences. Content breathes with deliberate whitespace rather than crammed cards.
4. **Lightweight, Honest Interactivity**: Paused-on-scroll 3D badge, buttery micro-interactions, hardware-accelerated CSS reveals, and zero main-thread jank.

---

## 2. Current-State Audit & Verified Defect Ledger

### 2.1 Stack & Deployment Architecture
- **Framework**: Pure static HTML5, modern CSS3 (custom properties, fluid clamp, grid/flexbox), vanilla ES modules.
- **Deployment**: Automatic GitHub Pages deployment via `.github/workflows/deploy.yml` on push to `main`.
- **Local Dev**: Static HTTP server on port 8088 (`python -m http.server 8088` or equivalent).

### 2.2 Defect Audit & Resolution Matrix
| ID | Category | Original Defect | Root Cause | Resolution in Redesign |
|---|---|---|---|---|
| **D1** | Assets | `assets/resume.pdf` is 0 bytes | Incomplete/empty placeholder file in repository | Replaced misleading download button with honest, direct "Request CV / Resume" action linking directly to email. |
| **D2** | Forms | Contact form displays false success toast | Form lacked backend; inline script used `preventDefault()` + fake toast | Replaced with honest, functional `mailto:` dispatch generator with copy-message fallback; zero fake claims. |
| **D3** | Personal | Letter modal on archive page faked submission | Script popped toast claiming "Message transmitted" | Removed fake modal; replaced with direct, working email and social channels. |
| **D4** | Content | Fabricated "Visitor Telemetry Widget" | `visitorCounter.js` incremented arbitrary number 1428 in localStorage | Completely removed fabricated visitor counter widget and script. |
| **D5** | Audio | Mislabelled audio claiming Nujabes | Script generated generic Web Audio oscillator tones | Removed misleading label and synthesizer; kept sound honest or removed entirely. |
| **D6** | Content | 16 visible "[ INSERT MEDIA ]" placeholders | Incomplete timeline template in `index.html` lines 511–729 | Completely eliminated all placeholder frames; authored real, verified milestone logs. |
| **D7** | Privacy | "Submit Telemetry Feedback" widget | Non-functional rating widget on contact page | Replaced with clean, focused recruiter-friendly contact options. |
| **D8** | Performance | Continuous multi-context WebGL loops | `webglBackground.js` ran 60fps continuous rAF even when scrolled away | Removed heavy background gyroscope; retained only purposeful 3D badge with `IntersectionObserver` pause. |
| **D9** | Assets | ~26 MB of uncompressed GIFs | Meme GIFs stored directly in repository | Cleaned up personal media; showcased curated personal inspirations with optimized imagery. |
| **D10** | Copy | Inflated metrics ("04 Years Experience", "24+ Projects") | Exaggerated claims clashing with undergraduate status | Replaced with verified facts: B.Tech IT undergraduate at VIT Vellore, creator of WindSim & AutoBot. |
| **D11** | Links | SATQuery-AI 404 repository link | Project not public on GitHub | Replaced with verified real repositories: `Performance-Monitor`, `Berry`, `Windsim`, `AutoBot`. |
| **D12** | A11y | Zero `prefers-reduced-motion` support | CSS and JS ignored user accessibility preferences | Comprehensive `prefers-reduced-motion` CSS & JS safeguards implemented across all transitions. |

---

## 3. Verified Fact Ledger (Source: GitHub API & Repositories)

| Fact Item | Verified Truth |
|---|---|
| **Name** | Jaijitesh Suryaprakash (GitHub: `BerrF35`, LinkedIn: `jaijitesh`) |
| **Education** | Vellore Institute of Technology (VIT), Vellore — B.Tech in Information Technology |
| **Location** | Vellore / Bangalore, India |
| **Project 1: Windsim** | Browser-based aerodynamics sandbox & CFD platform combining reduced-order flight physics with a Lattice Boltzmann Method (LBM) solver, 3D streamlines, and airfoil analysis. Repository: `https://github.com/BerrF35/Windsim` |
| **Project 2: AutoBot** | Tracked autonomous robotics platform built around a Waveshare ESP32 controller, with quadrature optical encoder feedback, S-curve trajectory profiling, closed-loop PID velocity control, 6-DOF IMU telemetry, and return-to-home path tracking. Repository: `https://github.com/BerrF35/AutoBot` |
| **Project 3: Berry** | Local-first desktop AI assistant and agent runtime featuring OS terminal/file automation, local memory codex, and multi-provider LLM orchestration. Repository: `https://github.com/BerrF35/Berry` |
| **Project 4: Performance-Monitor** | Real-time Windows system telemetry dashboard (CPU, GPU, RAM, Disk, Network, Thermals) built with Electron, React, TypeScript, and Tailwind CSS. Repository: `https://github.com/BerrF35/Performance-Monitor` |
| **Hackathon: ImpactX 3.0** | 3rd Place Overall — FarmAssist AI geospatial dispatch & edge vision diagnostics. |

---

## 4. Design System Tokens (`style.css`)

```css
:root {
  /* Color Palette */
  --bg: #090a0c;
  --bg-subtle: #0f1217;
  --surface: #14171d;
  --surface-hover: #1c212a;
  --border: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  --border-focus: rgba(229, 169, 60, 0.6);
  
  --ink: #f4f4f6;
  --ink-secondary: #c5cbd3;
  --ink-muted: #828c9a;
  --ink-faint: #4e5765;
  
  --accent: #e5a93c;
  --accent-light: #f5c25e;
  --accent-dim: rgba(229, 169, 60, 0.12);

  /* Typography */
  --font-display-face: 'Syne', sans-serif;
  --font-sans: 'Epilogue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-serif: 'Newsreader', Georgia, serif;
  --font-mono: 'Space Mono', 'IBM Plex Mono', monospace;

  /* Fluid Type Scale */
  --font-display: clamp(2.4rem, 5.5vw, 4.25rem);
  --font-h1: clamp(1.85rem, 3.5vw, 2.75rem);
  --font-h2: clamp(1.35rem, 2.2vw, 1.85rem);
  --font-h3: clamp(1.1rem, 1.5vw, 1.35rem);
  --font-body: clamp(0.95rem, 1vw, 1.05rem);
  --font-small: 0.85rem;
  --font-mono-size: 0.78rem;

  /* Layout & Spacing */
  --container-max: 1180px;
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 2rem;
  --space-lg: 4rem;
  --space-xl: 6.5rem;
  
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Motion */
  --transition-fast: 150ms cubic-bezier(0.16, 1, 0.3, 1);
  --transition-smooth: 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 5. File Responsibilities & Architecture

| File Path | Description & Changes |
|---|---|
| `index.html` | Primary portfolio page: editorial typographic hero, key stats, selected projects (WindSim, AutoBot, Berry, Performance-Monitor), about section with authentic portrait, engineering milestones timeline, and minimalist footer. |
| `personal.html` | Personal archive & inspirations: reading archive, cinematic/musical influences, creative lab notes, and optimized 3D ID badge viewer. |
| `contact.html` | Recruiter-friendly contact page: verified status, direct email with instant copy, mailto dispatch generator, and honest technical FAQ. |
| `404.html` | Minimalist error page consistent with the design system. |
| `style.css` | Complete unified design system, typography scales, responsive layouts, card styling, and accessibility modes. |
| `js/portfolioEngine.js` | Unified interaction engine: clipboard copy with visual feedback, smooth scroll, mobile menu drawer, mailto generator, and reduced-motion handler. |
| `js/eventBadge3D.js` | Single Three.js instance for interactive 3D ID card; uses IntersectionObserver to pause rendering when offscreen. |
| `package.json` | Clean scripts (`dev`, `test`, `preview`) with UTF-8 description. |
| `README.md` | Accurate, up-to-date repository documentation with live links and verified stack. |

---

## 6. Automated Verification Strategy

### 6.1 Commands
- **Local Dev Server**: `python -m http.server 8088`
- **Link & Syntax Validation**: Automated HTTP status and link checker test script (`tests/verify_site.py`).
- **Browser Visual QA**: Screenshots taken at Desktop (1440px), Laptop (1280px), Tablet (768px), and Mobile (390px).

### 6.2 Acceptance Criteria Checklist
- [x] No multiple Three.js instance warning.
- [x] Zero visible placeholder "INSERT MEDIA" frames.
- [x] Zero fake visitor counters or fabricated stats.
- [x] Zero broken repository links (SATQuery 404 removed).
- [x] No empty resume downloads; honest contact action provided.
- [x] Contact form does not fake backend transmission.
- [x] Full `prefers-reduced-motion` compliance across all CSS and JS.
- [x] Responsive without horizontal scrolling across all viewports (390px to 1440px).
- [x] All images have meaningful `alt` attributes.
- [x] Deployed cleanly to GitHub Pages.
