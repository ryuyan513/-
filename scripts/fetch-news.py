#!/usr/bin/env python3
"""GitHub Actions cron で定期実行。GDELT からニュースを取得して静的JSONとして保存。"""
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

GDELT = "https://api.gdeltproject.org/api/v2/doc/doc"
OUT_DIR = Path(__file__).parent.parent / "frontend" / "public"

ENERGY_TERMS = " OR ".join([
    "OPEC", "Hormuz", '"Saudi Arabia"', "UAE", "ADNOC",
    '"shale oil"', '"shale gas"', "LNG", '"crude oil"', '"oil price"',
    '"Brent crude"', "WTI", '"oil supply"', '"production cut"', '"Iran oil"',
    '"Russian oil"', "petroleum",
])

GLOBAL_TERMS = " OR ".join([
    "war", "conflict", "sanctions", "military",
    "ceasefire", "missile", "diplomacy", "geopolitical",
])


def fetch_gdelt(query: str, timespan: str = "48h", maxrecords: int = 50) -> dict:
    params = urllib.parse.urlencode({
        "query": query,
        "mode": "ArtList",
        "maxrecords": maxrecords,
        "format": "json",
        "timespan": timespan,
        "sort": "HybridRel",
    })
    url = f"{GDELT}?{params}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; WorldMonitor/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Fetching energy news from GDELT...")
    try:
        energy = fetch_gdelt(ENERGY_TERMS, timespan="48h", maxrecords=50)
        arts = energy.get("articles") or []
        print(f"  Energy: {len(arts)} articles")
        with open(OUT_DIR / "news-energy.json", "w", encoding="utf-8") as f:
            json.dump(energy, f, ensure_ascii=False)
    except Exception as e:
        print(f"  Energy fetch failed: {e}")

    print("Fetching global news from GDELT...")
    try:
        global_news = fetch_gdelt(GLOBAL_TERMS, timespan="24h", maxrecords=30)
        arts = global_news.get("articles") or []
        print(f"  Global: {len(arts)} articles")
        with open(OUT_DIR / "news-global.json", "w", encoding="utf-8") as f:
            json.dump(global_news, f, ensure_ascii=False)
    except Exception as e:
        print(f"  Global fetch failed: {e}")

    print("Done.")


if __name__ == "__main__":
    main()
