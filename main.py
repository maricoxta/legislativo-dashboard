"""
Legislativo Dashboard – servidor local
Execute: python main.py
Acesse:  http://localhost:8080
"""
import http.server
import socketserver
import os
import sys

PORT = 8080
SERVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "legislativo-dashboard")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SERVE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} – {fmt % args}")


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.allow_reuse_address = True
        print(f"\n✅  Legislativo Dashboard rodando em http://localhost:{PORT}\n")
        print("   Pressione Ctrl+C para parar.\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServidor encerrado.")
            sys.exit(0)
