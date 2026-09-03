import subprocess
import time
import json
import urllib.request
import asyncio
import websockets

async def main():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    proc = subprocess.Popen([
        edge_path,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--user-data-dir=C:\\Users\\Admin\\AppData\\Local\\Temp\\edge_debug_profile_2",
        "http://127.0.0.1:8088/"
    ])
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode())
        page = next(t for t in targets if t.get('type') == 'page' and '8088' in t.get('url', ''))
        ws_url = page['webSocketDebuggerUrl']

        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))

            start_time = time.time()
            while time.time() - start_time < 5:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=0.5)
                    data = json.loads(msg)
                    if data.get('method') == 'Runtime.exceptionThrown':
                        details = data['params']['exceptionDetails']
                        print("EXCEPTION DETAILS:", json.dumps(details, indent=2))
                except asyncio.TimeoutError:
                    pass
    finally:
        proc.terminate()

asyncio.run(main())
