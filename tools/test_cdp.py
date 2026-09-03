import subprocess
import time
import json
import urllib.request
import urllib.error

# Launch Edge with remote debugging
edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
proc = subprocess.Popen([
    edge_path,
    "--headless=new",
    "--remote-debugging-port=9222",
    "--user-data-dir=C:\\Users\\Admin\\AppData\\Local\\Temp\\edge_debug_profile",
    "http://127.0.0.1:8088/"
])

time.sleep(2)

try:
    with urllib.request.urlopen("http://127.0.0.1:9222/json") as resp:
        targets = json.loads(resp.read().decode())
    print("CDP targets:", targets)
finally:
    proc.terminate()
