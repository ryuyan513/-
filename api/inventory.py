import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import eia_get, parse_rows, send_json, now_iso, EIA_API_KEY
from http.server import BaseHTTPRequestHandler

URL = (
    f"https://api.eia.gov/v2/petroleum/stoc/wstk/data/"
    f"?api_key={EIA_API_KEY}"
    f"&frequency=weekly"
    f"&data[0]=value"
    f"&facets[series][]=WCESTUS1"
    f"&sort[0][column]=period"
    f"&sort[0][direction]=desc"
    f"&length=2"
)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        result, errors = {}, []
        try:
            rows = eia_get(URL).get("response", {}).get("data", [])
            p = parse_rows(rows, 1)
            if p:
                p["unit"] = "千バレル / Thousand Barrels"
            result["us_crude_stock"] = p
        except Exception as e:
            errors.append(str(e)[:100])
            result["us_crude_stock"] = None

        send_json(self, {
            "status": "ok",
            "data": result,
            "errors": errors,
            "updated_at": now_iso(),
        }, cache_seconds=3600)  # 1時間エッジキャッシュ

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def log_message(self, *a):
        pass
