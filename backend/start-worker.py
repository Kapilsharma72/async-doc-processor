import os
import sys
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess

# 1. Start a dummy HTTP server to satisfy Render's port check
class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

def run_http_server():
    port = int(os.environ.get("PORT", 8080))
    print(f"Starting dummy HTTP health server on port {port}...")
    server = HTTPServer(("", port), HealthCheckHandler)
    server.serve_forever()

# Start HTTP server in a daemon thread so it runs in the background
t = threading.Thread(target=run_http_server, daemon=True)
t.start()

# 2. Run Celery in the main process
print("Starting Celery worker...")
celery_args = [
    "celery",
    "-A", "app.worker.celery_app.celery_app",
    "worker",
    "--loglevel=info",
    "--concurrency=2"
]
sys.exit(subprocess.run(celery_args).returncode)
