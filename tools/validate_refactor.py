import urllib.request, re, os

# Check server connectivity
print("--- 1. Testing Local Server Connectivity ---")
try:
    response = urllib.request.urlopen("http://127.0.0.1:4173/")
    html = response.read().decode('utf-8')
    print(f"Status: {response.status} OK (HTML bytes: {len(html)})")
except Exception as e:
    print(f"Server error: {e}")

# Check key files referenced in index.html and src/
print("\n--- 2. Checking File Existence & Path Resolution ---")
required_files = [
    "index.html",
    "package.json",
    "README.md",
    "src/main.js",
    "src/core/state.js",
    "src/core/audio.js",
    "src/core/desk.js",
    "src/core/scene.js",
    "src/hardware/definitions.js",
    "src/hardware/cadLoader.js",
    "src/apps/simRobot.js",
    "src/apps/simWind.js",
    "src/apps/simAgent.js",
    "src/os/terminal.js",
    "src/os/pixelGame.js",
    "src/os/desktop.js",
    "src/styles/main.css",
    "assets/chassis.glb",
    "assets/raspberry.glb",
    "assets/esp32.glb",
    "assets/hp_omen_laptop.glb",
    "assets/canon_at-1_retro_camera.glb",
    "assets/telescope.glb",
    "assets/full_body_shepherd_dog_meshy.glb",
    "assets/3d_modelling_my_cat_fripouille.glb"
]

all_passed = True
for f in required_files:
    if os.path.exists(f):
        size = os.path.getsize(f)
        print(f"  [OK] {f} ({size:,} bytes)")
    else:
        print(f"  [FAIL] MISSING: {f}")
        all_passed = False

# Validate imports in all JS files
print("\n--- 3. Checking JS Import Resolution ---")
js_files = [f for f in required_files if f.endswith('.js')]
import_regex = re.compile(r'(?:import|from)\s+[\'"](\.[^\'"]+)[\'"]')

for js in js_files:
    with open(js, 'r', encoding='utf-8') as f:
        content = f.read()
    dir_name = os.path.dirname(js)
    imports = import_regex.findall(content)
    for imp in imports:
        resolved = os.path.normpath(os.path.join(dir_name, imp))
        if os.path.exists(resolved):
            print(f"  [OK] {js} -> {imp} (resolves to {resolved})")
        else:
            print(f"  [FAIL] {js} -> {imp} (NOT FOUND at {resolved})")
            all_passed = False

if all_passed:
    print("\n>>> ALL VALIDATION CHECKS PASSED PERFECTLY! <<<")
else:
    print("\n>>> SOME CHECKS FAILED <<<")
