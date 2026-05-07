"""
ui_server.py — Mini HTTP server handler for frontend on localhost:3000

Serves the frontend/ folder as the static root.
Intercepts GET /config.js and returns Supabase variables
read from the .env file in the project root.

Usage: python ui_server.py (run from project root)
Dependencies: pip install python-dotenv
"""

import http.server
import socketserver
import os
from dotenv import dotenv_values

PORT = 3000
ROOT_DIR     = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")
ENV_PATH     = os.path.join(ROOT_DIR, ".env")


def load_config():
    """Reads SUPABASE_URL and SUPABASE_KEY from .env in the project root."""
    env = dotenv_values(ENV_PATH)
    url = env.get("SUPABASE_URL", "")
    key = env.get("SUPABASE_KEY", "")
    if not url or not key:
        print("[WARNING] SUPABASE_URL or SUPABASE_KEY not found in .env!", flush=True)
    return url, key


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def do_GET(self):
        if self.path == "/config.js":
            self._serve_config_js()
        else:
            try:
                super().do_GET()
            except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
                pass

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def _serve_config_js(self):
        url, key = load_config()
        js_content = (
            f'window.SUPABASE_URL = "{url}";\n'
            f'window.SUPABASE_KEY = "{key}";\n'
        )
        body = js_content.encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/javascript; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}", flush=True)


if __name__ == "__main__":
    class ThreadingServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        """Allows the server to handle multiple requests simultaneously."""
        pass
    
    with ThreadingServer(("", PORT), Handler) as httpd:
        print(f"Frontend available at http://localhost:{PORT}", flush=True)
        print(f"Reading configuration from: {ENV_PATH}", flush=True)
        print("Press Ctrl+C to stop the server.", flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.", flush=True)