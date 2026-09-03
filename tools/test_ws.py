import subprocess
import time
import json
import urllib.request
import asyncio
import sys

async def run():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    proc = subprocess.Popen([
        edge_path,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--user-data-dir=C:\\Users\\Admin\\AppData\\Local\\Temp\\edge_debug_profile",
        "http://127.0.0.1:8088/"
    ])
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode())
        page = next(t for t in targets if t.get('type') == 'page' and '8088' in t.get('url', ''))
        ws_url = page['webSocketDebuggerUrl']
        print("Connecting to ws:", ws_url)

        # Use websockets or simple socket / asyncio websocket
        # Let's test if python has websockets module
    finally:
        proc.terminate()

asyncio.run(run())
