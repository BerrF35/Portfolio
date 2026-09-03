import subprocess
import time
import json
import urllib.request
import asyncio
import websockets

async def check_interactables():
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    proc = subprocess.Popen([
        edge_path,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--user-data-dir=C:\\Users\\Admin\\AppData\\Local\\Temp\\edge_debug_boxes",
        "http://127.0.0.1:8088/"
    ])
    await asyncio.sleep(2.5)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode())
        page = next(t for t in targets if t.get('type') == 'page' and '8088' in t.get('url', ''))
        async with websockets.connect(page['webSocketDebuggerUrl']) as ws:
            async def call(method, params=None):
                payload = {"id": 1, "method": method}
                if params: payload["params"] = params
                await ws.send(json.dumps(payload))
                while True:
                    r = json.loads(await ws.recv())
                    if r.get("id") == 1: return r.get("result", {})

            await call("Network.enable")
            await call("Network.setCacheDisabled", {"cacheDisabled": True})
            await call("Page.reload")
            await asyncio.sleep(1.5)
            await call("Runtime.evaluate", {"expression": "document.querySelector('#enter').click()"})
            await asyncio.sleep(3.5)

            res = await call("Runtime.evaluate", {
                "expression": """
                (() => {
                    return window.world ? window.world.interactables.map(obj => ({
                        name: obj.name,
                        type: obj.type,
                        prompt: obj.userData ? obj.userData.actionPrompt : ''
                    })) : 'no world';
                })()
                """,
                "returnByValue": True
            })
            print("CDP Result:", res)
            items = res.get("result", {}).get("value", [])
            for it in items:
                print(it)


    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    asyncio.run(check_interactables())
