import http.server
import socketserver
import os

PORT = 4173
DIRECTORY = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.js') or path.endswith('.mjs'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.glb') or path.endswith('.gltf'):
            return 'model/gltf-binary'
        if path.endswith('.wasm'):
            return 'application/wasm'
        return super().guess_type(path)

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"Serving HTTP on 127.0.0.1 port {PORT} (http://127.0.0.1:{PORT}/) ...")
    httpd.serve_forever()
