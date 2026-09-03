import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import base64

async def test_and_capture_angles():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    proc = subprocess.Popen([
        edge_path,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--window-size=1920,1080",
        "--user-data-dir=C:\\Users\\Admin\\AppData\\Local\\Temp\\edge_debug_profile_int",
        "http://127.0.0.1:8088/"
    ])
    await asyncio.sleep(2.5)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode())
        page = next(t for t in targets if t.get('type') == 'page' and '8088' in t.get('url', ''))
        ws_url = page['webSocketDebuggerUrl']

        async with websockets.connect(ws_url, max_size=30_000_000) as ws:
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

            # Click enter button to enter room
            print("Clicking enter button...")
            await call("Runtime.evaluate", {
                "expression": "document.querySelector('#enter').click()"
            })
            # Wait for room to finish loading
            await asyncio.sleep(3.5)

            # 1. Capture View 1: Facing Bed & Cat
            res1 = await call("Page.captureScreenshot", {"format": "jpeg", "quality": 85})
            with open("view1_bed_and_cat.jpg", "wb") as f:
                f.write(base64.b64decode(res1["data"]))
            print("Captured view 1 (Bed & Cat)!")

            # 2. Rotate camera to face Workstation Desk & Monitors (yaw = -1.3 rad)
            await call("Runtime.evaluate", {
                "expression": """
                if (window.fpov) {
                    window.fpov.yaw = -1.3;
                    window.fpov.pitch = -0.1;
                    if (typeof raycastCrosshair === 'function') raycastCrosshair();
                }
                """
            })
            await asyncio.sleep(0.5)
            res2 = await call("Page.captureScreenshot", {"format": "jpeg", "quality": 85})
            with open("view2_workstation_desk.jpg", "wb") as f:
                f.write(base64.b64decode(res2["data"]))
            print("Captured view 2 (Workstation Desk)!")

            # 3. Rotate camera to face Switchboard & Door (yaw = 2.8 rad)
            await call("Runtime.evaluate", {
                "expression": """
                if (window.fpov) {
                    window.fpov.yaw = 2.8;
                    window.fpov.pitch = 0.05;
                    if (typeof raycastCrosshair === 'function') raycastCrosshair();
                }
                """
            })
            await asyncio.sleep(0.5)
            res3 = await call("Page.captureScreenshot", {"format": "jpeg", "quality": 85})
            with open("view3_switchboard_door.jpg", "wb") as f:
                f.write(base64.b64decode(res3["data"]))
            print("Captured view 3 (Switchboard / Door)!")

            # 4. Aim directly at the Cat on the bed
            await call("Runtime.evaluate", {
                "expression": """
                if (window.fpov) {
                    window.fpov.yaw = 0.35;
                    window.fpov.pitch = -0.42;
                    if (typeof raycastCrosshair === 'function') raycastCrosshair();
                }
                """
            })
            await asyncio.sleep(0.5)
            prompt_cat = await call("Runtime.evaluate", {
                "expression": "document.getElementById('fpovPromptText') ? document.getElementById('fpovPromptText').textContent : ''"
            })
            cat_prompt = prompt_cat.get("result", {}).get("value")
            print("Crosshair Prompt over Cat:", cat_prompt)
            res4 = await call("Page.captureScreenshot", {"format": "jpeg", "quality": 85})
            with open("view4_cat_interaction.jpg", "wb") as f:
                f.write(base64.b64decode(res4["data"]))
            print("Captured view 4 (Cat interaction)!")

            # 5. Aim directly at the Switchboard on the wall
            await call("Runtime.evaluate", {
                "expression": """
                if (window.fpov) {
                    window.fpov.yaw = -2.85;
                    window.fpov.pitch = 0.08;
                    if (typeof raycastCrosshair === 'function') raycastCrosshair();
                }
                """
            })
            await asyncio.sleep(0.5)
            prompt_sw = await call("Runtime.evaluate", {
                "expression": "document.getElementById('fpovPromptText') ? document.getElementById('fpovPromptText').textContent : ''"
            })
            sw_prompt = prompt_sw.get("result", {}).get("value")
            print("Crosshair Prompt over Switchboard:", sw_prompt)
            res5 = await call("Page.captureScreenshot", {"format": "jpeg", "quality": 85})
            with open("view5_switchboard_interaction.jpg", "wb") as f:
                f.write(base64.b64decode(res5["data"]))
            print("Captured view 5 (Switchboard interaction)!")

    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(test_and_capture_angles())
