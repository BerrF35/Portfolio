import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import base64

async def main():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    proc = subprocess.Popen([
        edge_path,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--window-size=1920,1080",
        "--user-data-dir=C:\\Users\\Admin\\AppData\\Local\\Temp\\edge_debug_profile_7",
        "http://127.0.0.1:8088/"
    ])
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode())
        page = next(t for t in targets if t.get('type') == 'page' and '8088' in t.get('url', ''))
        ws_url = page['webSocketDebuggerUrl']

        async with websockets.connect(ws_url, max_size=30_000_000) as ws:
            await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Page.enable"}))

            # Trigger enter immediately to show loading screen
            await ws.send(json.dumps({
                "id": 10,
                "method": "Runtime.evaluate",
                "params": {"expression": "document.querySelector('#enter').click()"}
            }))
            await asyncio.sleep(0.3)

            # Capture loading screen
            await ws.send(json.dumps({
                "id": 20,
                "method": "Page.captureScreenshot",
                "params": {"format": "jpeg", "quality": 85}
            }))
            msg = await ws.recv()
            data = json.loads(msg)
            while data.get('id') != 20:
                msg = await ws.recv()
                data = json.loads(msg)
            img_data = base64.b64decode(data['result']['data'])
            with open("loading_screen_black.jpg", "wb") as f:
                f.write(img_data)
            print("Saved loading_screen_black.jpg!")

            # Wait for room to reveal
            await asyncio.sleep(3.5)
            await ws.send(json.dumps({
                "id": 30,
                "method": "Page.captureScreenshot",
                "params": {"format": "jpeg", "quality": 85}
            }))
            msg = await ws.recv()
            data = json.loads(msg)
            while data.get('id') != 30:
                msg = await ws.recv()
                data = json.loads(msg)
            img_data = base64.b64decode(data['result']['data'])
            with open("room_verified_new.jpg", "wb") as f:
                f.write(img_data)
            print("Saved room_verified_new.jpg!")

    finally:
        proc.terminate()

asyncio.run(main())
