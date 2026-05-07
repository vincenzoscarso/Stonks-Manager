"""
server.py — Mini server HTTP per il frontend su localhost:3000

Serve la cartella frontend/ come root statica.
Intercetta GET /config.js e restituisce le variabili Supabase
lette dal file .env nella root del progetto.

Avvio: python server.py  (dalla root del progetto)
Dipendenze: pip install python-dotenv
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
    """Legge SUPABASE_URL e SUPABASE_KEY dal .env nella root del progetto."""
    env = dotenv_values(ENV_PATH)
    url = env.get("SUPABASE_URL", "")
    key = env.get("SUPABASE_KEY", "")
    if not url or not key:
        print("[ATTENZIONE] SUPABASE_URL o SUPABASE_KEY non trovati nel .env!")
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
                pass # Ignora gli errori di disconnessione improvvisa del client

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass # Ignora gli errori se la connessione viene chiusa prima del completamento

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
        print(f"[{self.address_string()}] {format % args}")


if __name__ == "__main__":
    class ThreadingServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        pass
    
    with ThreadingServer(("", PORT), Handler) as httpd:
        print(f"Frontend disponibile su http://localhost:{PORT}")
        print(f"Leggo configurazione da: {ENV_PATH}")
        print("Premi Ctrl+C per fermare il server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer fermato.")

