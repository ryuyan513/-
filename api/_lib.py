"""
Vercel Python サーバーレス関数 — 共有ユーティリティ
"""
import json
import os
import httpx
from datetime import datetime, timezone
from urllib.parse import quote

EIA_API_KEY = os.environ.get("EIA_API_KEY", "DEMO_KEY")

SIGNAL_MAP: dict[str, list[str]] = {
    "hormuz":  ["hormuz", "strait", "persian gulf", "tanker attack", "gulf shipping"],
    "opec":    ["opec", "opec+", "oil cut", "production quota", "oil output", "barrel quota", "oil cartel"],
    "saudi":   ["saudi", "aramco", "riyadh", "mbs", "kingdom", "saudi oil"],
    "uae":     ["uae", "abu dhabi", "adnoc", "dubai", "emirates", "gulf state"],
    "shale":   ["shale", "permian", "fracking", "tight oil", "bakken", "eagle ford", "us shale"],
    "iran":    ["iran", "iranian", "tehran", "irgc", "khamenei", "iran oil", "iranian sanction"],
    "lng":     ["lng", "liquefied natural gas", "lng terminal", "lng cargo", "lng tanker", "lng export"],
}


def tag_signals(title: str) -> list[str]:
    t = title.lower()
    return [sig for sig, kws in SIGNAL_MAP.items() if any(kw in t for kw in kws)]


def eia_get(url: str) -> dict:
    with httpx.Client(timeout=8.0, follow_redirects=True) as c:
        r = c.get(url)
        r.raise_for_status()
        return r.json()


def gdelt_get(url: str) -> dict:
    with httpx.Client(timeout=8.0, follow_redirects=True) as c:
        r = c.get(url)
        r.raise_for_status()
        return r.json()


def parse_rows(rows: list, decimals: int = 2) -> dict | None:
    if not rows:
        return None
    cur, prev = rows[0], rows[1] if len(rows) > 1 else None
    try:
        cv = float(cur["value"])
        pv = float(prev["value"]) if prev else cv
        return {
            "price": round(cv, decimals),
            "period": cur.get("period", ""),
            "change": round(cv - pv, decimals),
        }
    except (TypeError, ValueError, KeyError):
        return None


def send_json(h, data: dict, status: int = 200, cache_seconds: int = 0):
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    h.send_response(status)
    h.send_header("Content-Type", "application/json; charset=utf-8")
    h.send_header("Access-Control-Allow-Origin", "*")
    h.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
    if cache_seconds > 0:
        h.send_header("Cache-Control", f"public, s-maxage={cache_seconds}, stale-while-revalidate={cache_seconds * 2}")
    h.send_header("Content-Length", str(len(body)))
    h.end_headers()
    h.wfile.write(body)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
