"""
OAuth on port 80 (exact match to registered http://localhost)
"""
import json, os, sys, threading, socket, time
from urllib.parse import urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler
import requests

CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), "credentials", "client_secret.json")
TOKEN_PATH = os.path.join(os.path.dirname(__file__), "token.json")

with open(CREDENTIALS_PATH) as f:
    creds = json.load(f)["installed"]

CLIENT_ID = creds["client_id"]
CLIENT_SECRET = creds["client_secret"]
REDIRECT_URI = "http://localhost/"
AUTH_URI = creds["auth_uri"]
TOKEN_URI = creds["token_uri"]

SCOPES = ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.metadata.readonly"]

code = None
event = threading.Event()

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        global code
        qs = parse_qs(urlparse(self.path).query)
        print(f"REQUEST: {self.path}", flush=True)
        if "code" in qs:
            code = qs["code"][0]
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b"OK - code captured")
            print("CODE CAPTURED!", flush=True)
            event.set()
        elif "error" in qs:
            self.send_response(400)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(f"Error: {qs['error'][0]}".encode())
            event.set()
        else:
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(f"<html><body>Path: {self.path}<br>Query: {dict(qs)}</body></html>".encode())
    def log_message(self, *a): pass

def exchange_code(c):
    r = requests.post(TOKEN_URI, data={
        "code": c, "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI, "grant_type": "authorization_code"})
    r.raise_for_status(); return r.json()

def main():
    try:
        server = HTTPServer(("0.0.0.0", 80), Handler)
    except PermissionError:
        print("Cannot bind port 80. Trying alternative...")
        sys.exit(1)

    params = {"client_id": CLIENT_ID, "redirect_uri": REDIRECT_URI, "response_type": "code",
              "scope": " ".join(SCOPES), "access_type": "offline", "prompt": "consent"}
    auth_url = requests.Request("GET", AUTH_URI, params=params).prepare().url

    print("="*70); print("GOOGLE DRIVE OAUTH - PORT 80"); print("="*70)
    print(f"\nAuth URL:\n{auth_url}")
    print(f"\nListening on http://localhost:80")
    sys.stdout.flush()

    server.timeout = 300
    while not event.is_set():
        server.handle_request()
    server.server_close()

    if not code:
        print("No code captured"); return

    print("Exchanging code...", flush=True)
    td = exchange_code(code)
    print("OK", flush=True)
    td["scopes"] = SCOPES
    with open(TOKEN_PATH, "w") as f:
        json.dump(td, f, indent=2)
    print(f"Saved to {TOKEN_PATH}", flush=True)
    has_rt = bool(td.get("refresh_token"))
    print(f"Refresh token: {'PRESENT' if has_rt else 'NOT PRESENT'}", flush=True)
    if has_rt:
        r = requests.post(TOKEN_URI, data={"refresh_token": td["refresh_token"],
            "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET, "grant_type": "refresh_token"})
        r.raise_for_status()
        print(f"Refresh OK, valid for {r.json().get('expires_in')}s", flush=True)
    print("DONE", flush=True)

if __name__ == "__main__":
    main()
