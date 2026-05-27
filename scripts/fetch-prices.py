#!/usr/bin/env python3
"""GitHub Actions で定期実行。Yahoo Finance から価格を取得して静的JSONに保存。"""
import json
import urllib.request
import urllib.parse
from pathlib import Path
from datetime import datetime, timezone

OUT_DIR = Path(__file__).parent.parent / "frontend" / "public"

# Yahoo Finance symbols
SYMBOLS = {
    "wti":       "CL=F",   # WTI crude oil futures
    "brent":     "BZ=F",   # Brent crude futures
    "henry_hub": "NG=F",   # Natural gas futures
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}


def fetch_yahoo(symbol: str) -> dict | None:
    encoded = urllib.parse.quote(symbol, safe="")
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}"
        "?interval=1d&range=5d"
    )
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
        result = data.get("chart", {}).get("result", [None])[0]
        if not result:
            return None
        meta = result.get("meta", {})
        price = meta.get("regularMarketPrice") or meta.get("previousClose")
        prev  = meta.get("previousClose") or price
        if price is None:
            return None
        ts = meta.get("regularMarketTime", 0)
        period = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d") if ts else ""
        return {
            "price":  round(float(price), 2),
            "change": round(float(price) - float(prev), 2),
            "period": period,
        }
    except Exception as e:
        print(f"  Yahoo Finance {symbol}: {e}")
        return None


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    result: dict = {}
    for key, symbol in SYMBOLS.items():
        print(f"Fetching {key} ({symbol})...")
        data = fetch_yahoo(symbol)
        if data:
            print(f"  → ${data['price']} ({data['change']:+.2f}) on {data['period']}")
        else:
            print(f"  → failed")
        result[key] = data

    out_path = OUT_DIR / "prices-cache.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"Saved to {out_path}")


if __name__ == "__main__":
    main()
