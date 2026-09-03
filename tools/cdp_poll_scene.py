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
        "--user-data-dir=C:\\Users\\Admin\\AppData\\Local\\Temp\\edge_debug_profile_3",
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
            await ws.send(json.dumps({"id": 2, "method": "Console.enable"}))

            # Poll window.state.ready and window.world.room
            start_time = time.time()
            while time.time() - start_time < 30:
                await ws.send(json.dumps({
                    "id": 100,
                    "method": "Runtime.evaluate",
                    "params": {"expression": "JSON.stringify({ ready: window.state ? window.state.ready : false, entered: window.state ? window.state.entered : false, hasRoom: !!(window.world && window.world.room), hasFan: !!(window.world && window.world.fanAction) })"}
                }))

                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    data = json.loads(msg)
                    if data.get('id') == 100:
                        val = data['result']['result']['value']
                        print("POLL STATE:", val)
                        status = json.loads(val)
                        if status.get('ready'):
                            print("SUCCESS! Scene is READY and room loaded!")
                            break
                    elif data.get('method') == 'Runtime.consoleAPICalled':
                        args = [str(a.get('value', a.get('description', ''))) for a in data['params']['args']]
                        print(f"[CONSOLE]: {' '.join(args)}")
                    elif data.get('method') == 'Runtime.exceptionThrown':
                        print(f"[EXCEPTION]: {data['params']['exceptionDetails']['text']}")
                except asyncio.TimeoutError:
                    pass
                await asyncio.sleep(1)

    finally:
        proc.terminate()

asyncio.run(main())
