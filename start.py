"""Start a local, dependency-free server for the game."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import argparse
import webbrowser

parser = argparse.ArgumentParser(description='Artifact Threefold local server')
parser.add_argument('--port', type=int, default=8787)
parser.add_argument('--host', default='0.0.0.0', help='Listen address (default: all network interfaces)')
parser.add_argument('--no-browser', action='store_true')
args = parser.parse_args()
directory = Path(__file__).resolve().parent / 'dist'
server = ThreadingHTTPServer((args.host, args.port), partial(SimpleHTTPRequestHandler, directory=str(directory)))
browser_host = '127.0.0.1' if args.host == '0.0.0.0' else args.host
url = f'http://{browser_host}:{args.port}'
print(f'Artifact Threefold: {url}\nListening on {args.host}:{args.port}\nPress Ctrl+C to stop.')
if not args.no_browser:
    webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
