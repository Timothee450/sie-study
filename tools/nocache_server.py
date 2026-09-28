"""Preview server with caching disabled. Serves the current directory on port 8765."""
import http.server
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
http.server.ThreadingHTTPServer(("", 8765), H).serve_forever()
