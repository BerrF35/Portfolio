import re, os

print("=== VERIFYING ROOT APP.JS AND JS/ DIRECTORY ===")
files_to_check = [
    "index.html",
    "app.js",
    "style.css",
    "js/audio.js",
    "js/cadLoader.js",
    "js/desktop.js",
    "js/terminal.js",
    "js/pixelGame.js",
    "js/simRobot.js",
    "js/simWind.js",
    "js/simAgent.js"
]

all_ok = True
for f in files_to_check:
    if os.path.exists(f):
        print(f"  [EXISTS] {f} ({os.path.getsize(f):,} bytes)")
    else:
        print(f"  [MISSING] {f}")
        all_ok = False

# Check all HARDWARE_DEFINITIONS files
with open("js/cadLoader.js", "r", encoding="utf-8") as f:
    cad_content = f.read()

models = re.findall(r"file:\s*['\"]([^'\"]+)['\"]", cad_content)
print("\n=== VERIFYING GLB 3D ASSETS IN JS/CADLOADER.JS ===")
for m in models:
    if os.path.exists(m):
        print(f"  [MODEL OK] {m} ({os.path.getsize(m):,} bytes)")
    else:
        print(f"  [MODEL MISSING] {m}")
        all_ok = False

# Check for any remaining mentions of 'books' or 'studio_setup' in js/
print("\n=== SCANNING FOR UNWANTED ASSET MENTIONS ===")
for f in files_to_check:
    if f.endswith('.js') or f.endswith('.html'):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        if 'sci-fi_hardcover_book_collection' in content:
            print(f"  [WARNING] 'sci-fi_hardcover_book_collection' found in {f}")
            all_ok = False
        if 'studio_setup' in content:
            print(f"  [WARNING] 'studio_setup' found in {f}")
            all_ok = False

if all_ok:
    print("\n>>> ALL CHECKS PASSED WITH ZERO ERRORS! <<<")
