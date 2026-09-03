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
        "--user-data-dir=C:\\Users\\Admin\\AppData\\Local\\Temp\\edge_debug_profile_" + str(int(time.time())),
        "http://127.0.0.1:8088/"
    ])
    await asyncio.sleep(2)

    try:
        req = urllib.request.urlopen("http://127.0.0.1:9222/json")
        targets = json.loads(req.read().decode())
        page = next(t for t in targets if t.get('type') == 'page' and '8088' in t.get('url', ''))
        ws_url = page['webSocketDebuggerUrl']
        print("Connected to:", ws_url)

        async with websockets.connect(ws_url) as ws:
            # Enable Console, Runtime, Network
            await ws.send(json.dumps({"id": 1, "method": "Console.enable"}))
            await ws.send(json.dumps({"id": 2, "method": "Runtime.enable"}))
            await ws.send(json.dumps({"id": 3, "method": "Network.enable"}))

            # Listen for 15 seconds, and also click #enter after 2 seconds
            start_time = time.time()
            clicked = False

            while time.time() - start_time < 20:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                    data = json.loads(msg)
                    method = data.get('method', '')

                    if method == 'Runtime.consoleAPICalled':
                        args = [str(a.get('value', a.get('description', ''))) for a in data['params']['args']]
                        print(f"[CONSOLE {data['params']['type'].upper()}]: {' '.join(args)}")

                    elif method == 'Runtime.exceptionThrown':
                        print(f"[EXCEPTION]: {data['params']['exceptionDetails']['text']} {data['params']['exceptionDetails'].get('exception', {}).get('description', '')}")

                    elif method == 'Network.loadingFailed':
                        print(f"[NETWORK FAILED]: requestId={data['params']['requestId']} errorText={data['params']['errorText']}")

                    elif method == 'Network.responseReceived':
                        resp = data['params']['response']
                        if 'assets' in resp['url']:
                            print(f"[NETWORK ASSET]: status={resp['status']} url={resp['url']} mime={resp['mimeType']}")

                except asyncio.TimeoutError:
                    pass

                if not clicked and time.time() - start_time > 2.5:
                    clicked = True
                    print("--> Clicking #enter button via Runtime.evaluate...")
                    await ws.send(json.dumps({
                        "id": 10,
                        "method": "Runtime.evaluate",
                        "params": {"expression": "document.querySelector('#enter').click()"}
                    }))

    finally:
        proc.terminate()

asyncio.run(main())
