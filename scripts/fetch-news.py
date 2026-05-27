#!/usr/bin/env python3
"""GitHub Actions cron で定期実行。ニュースをRSS/GDELTから取得して静的JSONに保存。"""
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

OUT_DIR = Path(__file__).parent.parent / "frontend" / "public"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
}

# Energy-focused RSS feeds
ENERGY_RSS = [
    "https://oilprice.com/rss/main",
    "https://www.eia.gov/rss/news_feed.xml",
    "https://feeds.reuters.com/reuters/businessNews",
    "https://www.ft.com/rss/home/uk",
]

# Global geopolitics RSS feeds
GLOBAL_RSS = [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://feeds.reuters.com/reuters/worldNews",
    "https://feeds.skynews.com/feeds/rss/world.xml",
]

# Keyword filter for energy/geopolitics relevance
ENERGY_KEYWORDS = [
    "oil", "opec", "lng", "crude", "petroleum", "shale", "brent", "wti",
    "hormuz", "saudi", "iran", "uae", "adnoc", "energy", "gas price",
    "barrel", "refinery", "aramco", "production cut",
]

GEOPOLITICAL_KEYWORDS = [
    "war", "conflict", "sanction", "military", "ceasefire", "missile",
    "diplomacy", "geopolit", "nato", "invasion", "nuclear", "attack",
    "strike", "tension", "election", "crisis",
]


def fetch_rss(url: str, max_items: int = 30) -> list[dict]:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
        root = ET.fromstring(content)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        items = []
        # RSS 2.0
        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            link  = (item.findtext("link")  or "").strip()
            pub   = (item.findtext("pubDate") or "").strip()
            desc  = re.sub(r"<[^>]+>", "", item.findtext("description") or "")
            domain = urllib.parse.urlparse(link).netloc
            if title and link:
                items.append({
                    "title": title,
                    "url": link,
                    "domain": domain,
                    "description": desc[:200],
                    "seendate": pub,
                    "tone": "0",
                    "language": "English",
                })
            if len(items) >= max_items:
                break
        # Atom fallback
        if not items:
            for entry in root.findall(".//{http://www.w3.org/2005/Atom}entry"):
                title = (entry.findtext("{http://www.w3.org/2005/Atom}title") or "").strip()
                link_el = entry.find("{http://www.w3.org/2005/Atom}link")
                link  = (link_el.get("href") if link_el is not None else "") or ""
                pub   = (entry.findtext("{http://www.w3.org/2005/Atom}updated") or "").strip()
                domain = urllib.parse.urlparse(link).netloc
                if title and link:
                    items.append({
                        "title": title,
                        "url": link,
                        "domain": domain,
                        "description": "",
                        "seendate": pub,
                        "tone": "0",
                        "language": "English",
                    })
                if len(items) >= max_items:
                    break
        return items
    except Exception as e:
        print(f"  RSS {url}: {e}")
        return []


def is_relevant(title: str, keywords: list[str]) -> bool:
    t = title.lower()
    return any(kw in t for kw in keywords)


def fetch_gdelt(query: str, timespan: str = "48h", maxrecords: int = 50) -> list[dict]:
    params = urllib.parse.urlencode({
        "query": query,
        "mode": "ArtList",
        "maxrecords": maxrecords,
        "format": "json",
        "timespan": timespan,
        "sort": "HybridRel",
    })
    url = f"https://api.gdeltproject.org/api/v2/doc/doc?{params}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        return data.get("articles") or []
    except Exception as e:
        print(f"  GDELT: {e}")
        return []


ENERGY_TERMS = (
    'OPEC OR Hormuz OR "Saudi Arabia" OR UAE OR ADNOC OR '
    '"shale oil" OR "shale gas" OR LNG OR "crude oil" OR "oil price" OR '
    '"Brent crude" OR WTI OR "oil supply" OR "production cut" OR "Iran oil"'
)

GLOBAL_TERMS = (
    "war OR conflict OR sanctions OR military OR "
    "ceasefire OR missile OR diplomacy OR geopolitical"
)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── Energy News ───────────────────────────────────────────────────────────
    print("Fetching energy news...")
    energy_arts: list[dict] = []

    # Try GDELT first
    gdelt_arts = fetch_gdelt(ENERGY_TERMS, timespan="48h", maxrecords=50)
    if gdelt_arts:
        energy_arts = gdelt_arts
        print(f"  GDELT: {len(energy_arts)} articles")
    else:
        # Fallback: energy RSS feeds
        for feed_url in ENERGY_RSS:
            items = fetch_rss(feed_url, max_items=20)
            relevant = [a for a in items if is_relevant(a["title"], ENERGY_KEYWORDS)]
            energy_arts.extend(relevant)
            print(f"  RSS {feed_url}: {len(relevant)} relevant / {len(items)} total")
            if len(energy_arts) >= 30:
                break
        energy_arts = energy_arts[:50]
        print(f"  Total energy articles: {len(energy_arts)}")

    with open(OUT_DIR / "news-energy.json", "w", encoding="utf-8") as f:
        json.dump({"articles": energy_arts}, f, ensure_ascii=False)

    # ── Global News ───────────────────────────────────────────────────────────
    print("Fetching global news...")
    global_arts: list[dict] = []

    gdelt_global = fetch_gdelt(GLOBAL_TERMS, timespan="24h", maxrecords=30)
    if gdelt_global:
        global_arts = gdelt_global
        print(f"  GDELT: {len(global_arts)} articles")
    else:
        for feed_url in GLOBAL_RSS:
            items = fetch_rss(feed_url, max_items=20)
            relevant = [a for a in items if is_relevant(a["title"], GEOPOLITICAL_KEYWORDS)]
            global_arts.extend(relevant)
            print(f"  RSS {feed_url}: {len(relevant)} relevant / {len(items)} total")
            if len(global_arts) >= 20:
                break
        global_arts = global_arts[:30]
        print(f"  Total global articles: {len(global_arts)}")

    with open(OUT_DIR / "news-global.json", "w", encoding="utf-8") as f:
        json.dump({"articles": global_arts}, f, ensure_ascii=False)

    print("Done.")


if __name__ == "__main__":
    main()
