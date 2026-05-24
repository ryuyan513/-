import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import gdelt_get, send_json, now_iso
from http.server import BaseHTTPRequestHandler
from urllib.parse import quote

GLOBAL_KEYWORDS = [
    "war", "conflict", "sanctions", "military", "ceasefire",
    "missile", "diplomacy", "geopolitical", "nuclear",
    "invasion", "airstrike", "naval", "coup",
]

QUERY = " OR ".join(
    f'"{kw}"' if " " in kw else kw for kw in GLOBAL_KEYWORDS
)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            url = (
                f"https://api.gdeltproject.org/api/v2/doc/doc"
                f"?query={quote(QUERY)}"
                f"&mode=ArtList"
                f"&maxrecords=30"
                f"&format=json"
                f"&timespan=12h"
                f"&sort=DateDesc"
            )
            data = gdelt_get(url)
            articles = [
                {
                    "title": a.get("title", ""),
                    "url": a.get("url", ""),
                    "source": a.get("domain", ""),
                    "seen_date": a.get("seendate", ""),
                    "language": a.get("language", "English"),
                    "tone": round(float(a.get("tone", 0)), 2),
                }
                for a in data.get("articles", [])
            ]
            send_json(self, {
                "status": "ok",
                "articles": articles,
                "count": len(articles),
                "updated_at": now_iso(),
            }, cache_seconds=300)
        except Exception as e:
            send_json(self, {"status": "error", "detail": str(e), "articles": []}, status=502)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def log_message(self, *a):
        pass
