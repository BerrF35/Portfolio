import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import base64

async def capture_views():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    proc = subprocess.Popen([
        edge_path,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--window-size=1920,1080",
        "--user-data-dir=C:\\Users\\Admin\\AppData\\Local\\Temp\\edge_debug_lighting_new",
        "http://127.0.0.1:8088/"
    ])
    await asyncio.sleep(2.5)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode())
        page = next(t for t in targets if t.get('type') == 'page' and '8088' in t.get('url', ''))

        async with websockets.connect(page['webSocketDebuggerUrl'], max_size=30_000_000) as ws:
            msg_id = 1
            async def call(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "method": method}
                if params:
                    payload["params"] = params
                await ws.send(json.dumps(payload))
                while True:
                    raw = await ws.recv()
                    data = json.loads(raw)
                    if data.get("id") == msg_id:
                        return data.get("result", {})

            await call("Runtime.enable")
            await call("Page.enable")
            await call("Network.enable")
            await call("Network.setCacheDisabled", {"cacheDisabled": True})

            print("Entering lab...")
            await call("Runtime.evaluate", {
                "expression": "document.querySelector('#enter').click()"
            })
            await asyncio.sleep(3.5)

            # View 1: Bed, Cat, Upper Wall & Ladder
            res1 = await call("Page.captureScreenshot", {"format": "jpeg", "quality": 90})
            with open("dim_view1_bed_and_walls.jpg", "wb") as f:
                f.write(base64.b64decode(res1["data"]))
            print("Captured dim_view1_bed_and_walls.jpg")

            # View 2: Workstation Desk, Monitors, Notes & Desk Wall
            await call("Runtime.evaluate", {
                "expression": """
                if (window.fpov && window.camera) {
                    window.fpov.yaw = -1.3;
                    window.fpov.pitch = -0.1;
                    camera.rotation.y = window.fpov.yaw;
                    camera.rotation.x = window.fpov.pitch;
                }
                """
            })
            await asyncio.sleep(0.5)
            res2 = await call("Page.captureScreenshot", {"format": "jpeg", "quality": 90})
            with open("dim_view2_desk_and_monitors.jpg", "wb") as f:
                f.write(base64.b64decode(res2["data"]))
            print("Captured dim_view2_desk_and_monitors.jpg")

            # View 3: Back Wall, Illuminated Slats & Ceiling
            await call("Runtime.evaluate", {
                "expression": """
                if (window.fpov && window.camera) {
                    window.fpov.yaw = 2.8;
                    window.fpov.pitch = 0.15;
                    camera.rotation.y = window.fpov.yaw;
                    camera.rotation.x = window.fpov.pitch;
                }
                """
            })
            await asyncio.sleep(0.5)
            res3 = await call("Page.captureScreenshot", {"format": "jpeg", "quality": 90})
            with open("dim_view3_backwall_slats_ceiling.jpg", "wb") as f:
                f.write(base64.b64decode(res3["data"]))
            print("Captured dim_view3_backwall_slats_ceiling.jpg")

            # View 4: Yellow Vault Door & Airlock Hallway Wall
            await call("Runtime.evaluate", {
                "expression": """
                if (window.fpov && window.camera) {
                    window.fpov.yaw = -2.2;
                    window.fpov.pitch = 0.05;
                    camera.rotation.y = window.fpov.yaw;
                    camera.rotation.x = window.fpov.pitch;
                }
                """
            })
            await asyncio.sleep(0.5)
            res4 = await call("Page.captureScreenshot", {"format": "jpeg", "quality": 90})
            with open("dim_view4_door_airlock.jpg", "wb") as f:
                f.write(base64.b64decode(res4["data"]))
            print("Captured dim_view4_door_airlock.jpg")

            # View 5: Dog, Armchair, Books & Circular Window Wall
            await call("Runtime.evaluate", {
                "expression": """
                if (window.fpov && window.camera) {
                    window.fpov.yaw = 0.5;
                    window.fpov.pitch = -0.3;
                    camera.rotation.y = window.fpov.yaw;
                    camera.rotation.x = window.fpov.pitch;
                }
                """
            })
            await asyncio.sleep(0.5)
            res5 = await call("Page.captureScreenshot", {"format": "jpeg", "quality": 90})
            with open("dim_view5_window_dog_sofa.jpg", "wb") as f:
                f.write(base64.b64decode(res5["data"]))
            print("Captured dim_view5_window_dog_sofa.jpg")

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(capture_views())
