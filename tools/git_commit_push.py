import subprocess, os

def run(cmd):
    print(f">> {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if res.stdout:
        print(res.stdout.strip())
    if res.stderr:
        print(f"ERR: {res.stderr.strip()}")
    return res

# 1. Init git if needed
if not os.path.exists(".git"):
    run("git init -b main")
else:
    run("git branch -M main")

# Set remote origin
run("git remote remove origin")
run("git remote add origin https://github.com/BerrF35/Portfolio.git")

# Mapping of files to caveman minimal commit messages
commits = [
    (".gitignore", "add gitignore"),
    ("package.json", "add package config"),
    ("README.md", "write readme docs"),
    ("style.css", "make main styles"),
    ("index.html", "make html entry"),
    ("app.js", "main app loop"),
    ("js/audio.js", "add sound beeps"),
    ("js/cadLoader.js", "load 3d models"),
    ("js/desktop.js", "make os desktop"),
    ("js/terminal.js", "add cli terminal"),
    ("js/pixelGame.js", "add pixel timeline"),
    ("js/simRobot.js", "add robot sim"),
    ("js/simWind.js", "add wind sim"),
    ("js/simAgent.js", "add ai agent graph"),
    ("src/core/state.js", "core state"),
    ("src/core/audio.js", "core synth audio"),
    ("src/core/desk.js", "build 3d desk"),
    ("src/core/scene.js", "setup 3d room and lights"),
    ("src/hardware/definitions.js", "hardware telemetry info"),
    ("src/hardware/cadLoader.js", "cad model loader"),
    ("src/apps/simRobot.js", "robot sim module"),
    ("src/apps/simWind.js", "wind sim module"),
    ("src/apps/simAgent.js", "ai agent module"),
    ("src/os/terminal.js", "terminal cli module"),
    ("src/os/pixelGame.js", "pixel game module"),
    ("src/os/desktop.js", "os desktop module"),
    ("src/styles/main.css", "modular main css"),
    ("src/main.js", "modular main entry"),
    ("assets/chassis.glb", "add berrybot 3d model"),
    ("assets/raspberry.glb", "add raspberry pi model"),
    ("assets/esp32.glb", "add esp32 model"),
    ("assets/hp_omen_laptop.glb", "add laptop workstation model"),
    ("assets/canon_at-1_retro_camera.glb", "add canon camera model"),
    ("assets/telescope.glb", "add telescope model"),
    ("assets/full_body_shepherd_dog_meshy.glb", "add berry dog model"),
    ("assets/3d_modelling_my_cat_fripouille.glb", "add crispy cat model"),
    ("assets/cad/TV_ensemble complet.STEP", "add solidworks cad assembly"),
    ("assets/cad/PCB_ESP32-38Pines.step", "add esp32 step cad"),
    ("assets/cad/Raspberry Pi 4 Model B.STEP", "add pi4 step cad"),
    ("tools/inspect_models.py", "add model inspector tool"),
    ("tools/check_dimensions.py", "add dimension checker tool"),
    ("tools/validate_refactor.py", "add validation tool"),
    ("tools/verify_all.py", "add verify tool"),
    ("tools/start-preview.ps1", "add preview server script")
]

for file_path, msg in commits:
    if os.path.exists(file_path):
        run(f'git add "{file_path}"')
        run(f'git commit -m "{msg}"')

print("\n--- ALL INDIVIDUAL COMMITS CREATED ---")
run("git log --oneline -n 20")

print("\n--- PUSHING TO ORIGIN MAIN ---")
res = run("git push -u origin main")
if res.returncode == 0:
    print("\n>>> PUSH SUCCESSFUL! <<<")
else:
    print("\n>>> PUSH ATTEMPT COMPLETED <<<")
