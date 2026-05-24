import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import gdelt_get, tag_signals, send_json, now_iso
from http.server import BaseHTTPRequestHandler
from urllib.parse import quote

ENERGY_KEYWORDS = [
    '"OPEC"', '"OPEC+"', '"Hormuz"', '"Saudi Arabia"', '"Saudi Aramco"',
    '"UAE"', '"Abu Dhabi"', '"ADNOC"',
    '"shale oil"', '"shale gas"', '"Permian Basin"',
    '"LNG"', '"liquefied natural gas"',
    '"crude oil"', '"oil price"', '"Brent crude"', '"WTI"',
    '"natural gas price"', '"petroleum"', '"energy security"',
    '"oil supply"', '"oil output"', '"production cut"',
    '"Iran oil"', '"oil sanction"', '"Russian oil"',
]

QUERY = " OR ".join(ENERGY_KEYWORDS)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            url = (
                f"https://api.gdeltproject.org/api/v2/doc/doc"
                f"?query={quote(QUERY)}"
                f"&mode=ArtList"
                f"&maxrecords=50"
                f"&format=json"
                f"&timespan=24h"
                f"&sort=HybridRel"
            )
            data = gdelt_get(url)
            articles = []
            for a in data.get("articles", []):
                articles.append({
                    "title": a.get("title", ""),
                    "url": a.get("url", ""),
                    "source": a.get("domain", ""),
                    "seen_date": a.get("seendate", ""),
                    "language": a.get("language", "English"),
                    "tone": round(float(a.get("tone", 0)), 2),
                    "social_image": a.get("socialimage", ""),
                    "signals": tag_signals(a.get("title", "")),
                })
            send_json(self, {
                "status": "ok",
                "articles": articles,
                "count": len(articles),
                "updated_at": now_iso(),
            }, cache_seconds=300)  # 5分エッジキャッシュ
        except Exception as e:
            send_json(self, {"status": "error", "detail": str(e), "articles": []}, status=502)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def log_message(self, *a):
        pass
