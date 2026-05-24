import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import eia_get, parse_rows, send_json, now_iso, EIA_API_KEY
from http.server import BaseHTTPRequestHandler


def _eia_url(route: str, series: str, freq: str = "daily", length: int = 2) -> str:
    return (
        f"https://api.eia.gov/v2/{route}/data/"
        f"?api_key={EIA_API_KEY}"
        f"&frequency={freq}"
        f"&data[0]=value"
        f"&facets[series][]={series}"
        f"&sort[0][column]=period"
        f"&sort[0][direction]=desc"
        f"&length={length}"
    )


METRICS = {
    "wti":       (_eia_url("petroleum/pri/spt", "EER_EPCWTI_PF4_Y35NY_DPG"), 2, "USD/barrel"),
    "brent":     (_eia_url("petroleum/pri/spt", "EER_EPCO_PF4_Y35NY_DPG"),   2, "USD/barrel"),
    "henry_hub": (_eia_url("natural-gas/pri/sum", "RNGWHHD"),                 3, "USD/MMBtu"),
    "gasoline":  (_eia_url("petroleum/pri/gnd", "EMM_EPM0_PTE_NUS_DPG", "weekly"), 3, "USD/gallon"),
}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        result, errors = {}, []
        for key, (url, dec, unit) in METRICS.items():
            try:
                rows = eia_get(url).get("response", {}).get("data", [])
                p = parse_rows(rows, dec)
                if p:
                    p["unit"] = unit
                result[key] = p
            except Exception as e:
                errors.append(f"{key}: {str(e)[:80]}")
                result[key] = None

        send_json(self, {
            "status": "ok",
            "data": result,
            "errors": errors,
            "api_key_set": EIA_API_KEY != "DEMO_KEY",
            "updated_at": now_iso(),
        }, cache_seconds=1800)  # 30分エッジキャッシュ

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def log_message(self, *a):
        pass
