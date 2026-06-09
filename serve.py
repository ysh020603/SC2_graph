#!/usr/bin/env python3
"""Start a local HTTP server for the SC2 knowledge graph viewer."""

from __future__ import annotations

import argparse
import http.server
import os
import socketserver
from pathlib import Path


class ReuseAddrTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


class GraphViewerHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self) -> None:
        if self.path in ("/", ""):
            self.send_response(302)
            self.send_header("Location", "/index.html")
            self.end_headers()
            return
        super().do_GET()


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the SC2 graph viewer.")
    parser.add_argument("--port", type=int, default=8765, help="HTTP port (default: 8765)")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host (default: 127.0.0.1)")
    args = parser.parse_args()

    viewer_root = Path(__file__).resolve().parent
    os.chdir(viewer_root)

    url = f"http://{args.host}:{args.port}/"

    try:
        httpd = ReuseAddrTCPServer((args.host, args.port), GraphViewerHandler)
    except OSError as error:
        if error.errno in {48, 98, 10048}:  # macOS / Linux / Windows: address in use
            print(f"错误：端口 {args.port} 已被占用。")
            print(f"若服务已在运行，可直接打开: {url}")
            print(f"或换端口启动: python3 serve.py --port {args.port + 1}")
            print(f"或结束占用进程后重试: fuser -k {args.port}/tcp")
            raise SystemExit(1) from error
        raise

    with httpd:
        print(f"Serving {viewer_root}")
        print(f"Open: {url}")
        print("Press Ctrl+C to stop.")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
