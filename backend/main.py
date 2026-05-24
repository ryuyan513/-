"""
世界エネルギー監視ダッシュボード — バックエンド API
World Energy Intelligence Monitor — Backend API

データソース:
  - EIA Open Data API  : WTI / ブレント / ヘンリーハブ / 米国原油在庫
  - GDELT DOC 2.0 API  : 地政学ニュース（石油・ガス / 世界情勢）
"""

import os
import time
import asyncio
from datetime import datetime, timezone
from urllib.parse import quote

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(title="World Energy Monitor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

EIA_API_KEY = os.environ.get("EIA_API_KEY", "DEMO_KEY")

# ---------------------------------------------------------------------------
# Simple in-memory cache  {key: (data, timestamp)}
# ---------------------------------------------------------------------------
_cache: dict = {}


def _get(key: str, ttl: float) -> dict | None:
    if key in _cache:
        data, ts = _cache[key]
        if time.time() - ts < ttl:
            return data
    return None


def _set(key: str, data: dict) -> None:
    _cache[key] = (data, time.time())


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------
async def fetch_json(url: str, timeout: float = 20.0) -> dict:
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()


# ---------------------------------------------------------------------------
# EIA series helpers
# ---------------------------------------------------------------------------
def _eia_spot(series: str, length: int = 2) -> str:
    return (
        f"https://api.eia.gov/v2/petroleum/pri/spt/data/"
        f"?api_key={EIA_API_KEY}"
        f"&frequency=daily"
        f"&data[0]=value"
        f"&facets[series][]={series}"
        f"&sort[0][column]=period"
        f"&sort[0][direction]=desc"
        f"&length={length}"
    )


def _eia_gas(length: int = 2) -> str:
    # Henry Hub Natural Gas Spot (daily)
    return (
        f"https://api.eia.gov/v2/natural-gas/pri/sum/data/"
        f"?api_key={EIA_API_KEY}"
        f"&frequency=daily"
        f"&data[0]=value"
        f"&facets[series][]=RNGWHHD"
        f"&sort[0][column]=period"
        f"&sort[0][direction]=desc"
        f"&length={length}"
    )


def _eia_gasoline(length: int = 2) -> str:
    return (
        f"https://api.eia.gov/v2/petroleum/pri/gnd/data/"
        f"?api_key={EIA_API_KEY}"
        f"&frequency=weekly"
        f"&data[0]=value"
        f"&facets[series][]=EMM_EPM0_PTE_NUS_DPG"
        f"&sort[0][column]=period"
        f"&sort[0][direction]=desc"
        f"&length={length}"
    )


def _eia_inventory(length: int = 2) -> str:
    return (
        f"https://api.eia.gov/v2/petroleum/stoc/wstk/data/"
        f"?api_key={EIA_API_KEY}"
        f"&frequency=weekly"
        f"&data[0]=value"
        f"&facets[series][]=WCESTUS1"
        f"&sort[0][column]=period"
        f"&sort[0][direction]=desc"
        f"&length={length}"
    )


def _parse_rows(rows: list, decimals: int = 2) -> dict | None:
    if not rows:
        return None
    cur = rows[0]
    prev = rows[1] if len(rows) > 1 else None
    try:
        cur_val = float(cur["value"])
        prev_val = float(prev["value"]) if prev else cur_val
        return {
            "price": round(cur_val, decimals),
            "period": cur.get("period", ""),
            "change": round(cur_val - prev_val, decimals),
            "unit": cur.get("units", ""),
        }
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/energy-prices")
async def energy_prices():
    """WTI / ブレント / ヘンリーハブ / ガソリン（EIA、キャッシュ30分）"""
    cached = _get("energy_prices", 1800)  # 30 min — EIA data is daily
    if cached:
        return cached

    tasks = {
        "wti": _eia_spot("EER_EPCWTI_PF4_Y35NY_DPG"),
        "brent": _eia_spot("EER_EPCO_PF4_Y35NY_DPG"),
        "henry_hub": _eia_gas(),
        "gasoline": _eia_gasoline(),
    }

    results: dict = {}
    errors: list[str] = []

    for key, url in tasks.items():
        try:
            data = await fetch_json(url)
            rows = data.get("response", {}).get("data", [])
            parsed = _parse_rows(rows, decimals=3 if key in ("henry_hub", "gasoline") else 2)
            results[key] = parsed
        except Exception as exc:
            errors.append(f"{key}: {str(exc)[:120]}")
            results[key] = None

    response = {
        "status": "ok",
        "data": results,
        "errors": errors,
        "api_key_set": EIA_API_KEY != "DEMO_KEY",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("energy_prices", response)
    return response


@app.get("/api/inventory")
async def inventory():
    """米国原油週次在庫（EIA、キャッシュ60分）"""
    cached = _get("inventory", 3600)  # 60 min — weekly data
    if cached:
        return cached

    result: dict = {}
    errors: list[str] = []

    try:
        data = await fetch_json(_eia_inventory())
        rows = data.get("response", {}).get("data", [])
        parsed = _parse_rows(rows, decimals=1)
        if parsed:
            parsed["unit"] = "千バレル / Thousand Barrels"
        result["us_crude_stock"] = parsed
    except Exception as exc:
        errors.append(f"inventory: {str(exc)[:120]}")
        result["us_crude_stock"] = None

    response = {
        "status": "ok",
        "data": result,
        "errors": errors,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("inventory", response)
    return response


# ---------------------------------------------------------------------------
# GDELT queries
# ---------------------------------------------------------------------------
_ENERGY_KEYWORDS = [
    '"OPEC"', '"OPEC+"', '"Hormuz"', '"Saudi Arabia"', '"Saudi Aramco"',
    '"UAE"', '"Abu Dhabi"', '"ADNOC"',
    '"shale oil"', '"shale gas"', '"Permian Basin"',
    '"LNG"', '"liquefied natural gas"',
    '"natural gas price"', '"crude oil"', '"oil price"',
    '"Brent crude"', '"WTI"', '"petroleum"',
    '"energy security"', '"oil supply"', '"oil output"',
    '"production cut"', '"Iran oil"', '"oil sanction"',
    '"Russian oil"', '"oil tanker"', '"oil refinery"',
]

_GLOBAL_KEYWORDS = [
    "war", "conflict", "sanctions", "military strike", "ceasefire",
    "missile attack", "diplomacy", "geopolitical", "nuclear",
    "invasion", "coalition", "airstrike", "naval",
]

_SIGNAL_MAP: dict[str, list[str]] = {
    "hormuz":  ["hormuz", "strait", "persian gulf", "tanker attack"],
    "opec":    ["opec", "opec+", "oil cut", "production quota", "oil output", "barrel quota"],
    "saudi":   ["saudi", "aramco", "riyadh", "mbs", "kingdom"],
    "uae":     ["uae", "abu dhabi", "adnoc", "dubai", "emirates"],
    "shale":   ["shale", "permian", "fracking", "tight oil", "bakken", "eagle ford"],
    "iran":    ["iran", "iranian", "tehran", "irgc", "khamenei", "rouhani"],
    "lng":     ["lng", "liquefied natural gas", "lng terminal", "lng cargo", "lng tanker"],
}


def _tag_signals(title: str) -> list[str]:
    t = title.lower()
    return [sig for sig, kws in _SIGNAL_MAP.items() if any(kw in t for kw in kws)]


def _gdelt_url(query: str, maxrecords: int = 50, timespan: str = "24h", sort: str = "HybridRel") -> str:
    return (
        f"https://api.gdeltproject.org/api/v2/doc/doc"
        f"?query={quote(query)}"
        f"&mode=ArtList"
        f"&maxrecords={maxrecords}"
        f"&format=json"
        f"&timespan={timespan}"
        f"&sort={sort}"
    )


def _parse_articles(raw: list, tag_signals: bool = False) -> list[dict]:
    articles = []
    for a in raw:
        item = {
            "title": a.get("title", ""),
            "url": a.get("url", ""),
            "source": a.get("domain", ""),
            "seen_date": a.get("seendate", ""),
            "language": a.get("language", "English"),
            "tone": round(float(a.get("tone", 0)), 2),
            "social_image": a.get("socialimage", ""),
        }
        if tag_signals:
            item["signals"] = _tag_signals(item["title"])
        articles.append(item)
    return articles


@app.get("/api/energy-news")
async def energy_news():
    """石油・ガス・地政学ニュース（GDELT 24h、キャッシュ5分）"""
    cached = _get("energy_news", 300)
    if cached:
        return cached

    query = " OR ".join(_ENERGY_KEYWORDS)
    try:
        data = await fetch_json(_gdelt_url(query, maxrecords=50, timespan="24h"))
        articles = _parse_articles(data.get("articles", []), tag_signals=True)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GDELT error: {exc}")

    response = {
        "status": "ok",
        "articles": articles,
        "count": len(articles),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("energy_news", response)
    return response


@app.get("/api/global-news")
async def global_news():
    """世界情勢ニュース（GDELT 12h、キャッシュ5分）"""
    cached = _get("global_news", 300)
    if cached:
        return cached

    query = " OR ".join(f'"{kw}"' if " " in kw else kw for kw in _GLOBAL_KEYWORDS)
    try:
        data = await fetch_json(_gdelt_url(query, maxrecords=30, timespan="12h", sort="DateDesc"))
        articles = _parse_articles(data.get("articles", []))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GDELT error: {exc}")

    response = {
        "status": "ok",
        "articles": articles,
        "count": len(articles),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    _set("global_news", response)
    return response


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
