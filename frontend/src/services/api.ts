import type { EnergyPrices, InventoryData, NewsArticle } from "../types";

// EIA key for gasoline / inventory endpoints (these work with the EIA API)
const EIA_KEY =
  import.meta.env.VITE_EIA_API_KEY ||
  "YylT17ZFZlt4w5DVIOIZAEJZJuoIRYeW1eRP36w3";
const EIA = "https://api.eia.gov/v2";

// Static JSON files built into GitHub Pages (updated by GitHub Actions cron)
// BASE_URL = '/-/' on GitHub Pages, '/' in dev
const BASE = import.meta.env.BASE_URL;

// ─── シグナルキーワードマップ ────────────────────────────────────────────────
export const SIGNAL_MAP: Record<string, string[]> = {
  hormuz: ["hormuz", "strait", "persian gulf", "tanker attack", "gulf shipping"],
  opec:   ["opec", "opec+", "oil cut", "production quota", "oil output", "oil cartel"],
  saudi:  ["saudi", "aramco", "riyadh", "mbs", "saudi oil", "kingdom"],
  uae:    ["uae", "abu dhabi", "adnoc", "dubai", "emirates"],
  shale:  ["shale", "permian", "fracking", "tight oil", "bakken", "eagle ford"],
  iran:   ["iran", "iranian", "tehran", "irgc", "iran oil", "iranian sanction"],
  lng:    ["lng", "liquefied natural gas", "lng terminal", "lng cargo", "lng export"],
};

export function tagSignals(title: string): string[] {
  const t = title.toLowerCase();
  return Object.entries(SIGNAL_MAP)
    .filter(([, kws]) => kws.some((kw) => t.includes(kw)))
    .map(([id]) => id);
}

// ─── EIA ヘルパー (ガソリン・在庫のみ) ────────────────────────────────────────
function eiaUrl(route: string, series: string, freq = "daily", len = 3): string {
  return (
    `${EIA}/${route}/data/?api_key=${EIA_KEY}` +
    `&frequency=${freq}&data[0]=value` +
    `&facets[series][]=${series}` +
    `&sort[0][column]=period&sort[0][direction]=desc&length=${len}`
  );
}

function parseRows(
  rows: { value: string | null; period: string }[] | undefined,
  dec: number
): { price: number; period: string; change: number } | null {
  // Filter out null/invalid values
  const valid = (rows ?? []).filter(
    (r) => r.value !== null && r.value !== "null" && !isNaN(parseFloat(r.value ?? ""))
  );
  if (!valid.length) return null;
  try {
    const cur  = parseFloat(valid[0].value!);
    const prev = valid[1] ? parseFloat(valid[1].value!) : cur;
    const factor = 10 ** dec;
    return {
      price:  Math.round(cur  * factor) / factor,
      period: valid[0].period,
      change: Math.round((cur - prev) * factor) / factor,
    };
  } catch {
    return null;
  }
}

async function eiaFetch(url: string) {
  const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`EIA ${r.status}`);
  return r.json();
}

// ─── 価格 (WTI/Brent/天然ガス = Yahoo Finance 静的キャッシュ、ガソリン/在庫 = EIA) ──
export async function fetchEnergyPrices(): Promise<EnergyPrices> {
  const result: EnergyPrices = { wti: null, brent: null, henry_hub: null, gasoline: null };

  await Promise.allSettled([
    // WTI, Brent, Henry Hub: GitHub Actions が Yahoo Finance から取得して静的保存
    fetch(`${BASE}prices-cache.json`, { cache: "no-cache", signal: AbortSignal.timeout(8000) })
      .then((r) => r.json())
      .then((d: Record<string, { price: number; change: number; period: string } | null>) => {
        if (d.wti)       result.wti       = { ...d.wti,       unit: "USD/barrel" };
        if (d.brent)     result.brent     = { ...d.brent,     unit: "USD/barrel" };
        if (d.henry_hub) result.henry_hub = { ...d.henry_hub, unit: "USD/MMBtu"  };
      }),

    // ガソリン: EIA (週次, 動作確認済み)
    eiaFetch(eiaUrl("petroleum/pri/gnd", "EMM_EPM0_PTE_NUS_DPG", "weekly")).then((d) => {
      const p = parseRows(d?.response?.data, 3);
      if (p) result.gasoline = { ...p, unit: "USD/gallon" };
    }),
  ]);

  return result;
}

export async function fetchInventory(): Promise<InventoryData> {
  try {
    const d = await eiaFetch(eiaUrl("petroleum/stoc/wstk", "WCESTUS1", "weekly"));
    const p = parseRows(d?.response?.data, 1);
    return { us_crude_stock: p ? { ...p, unit: "千バレル" } : null };
  } catch {
    return { us_crude_stock: null };
  }
}

// ─── ニュース (GitHub Actions が取得した静的JSONを読み込む) ──────────────────
function parseArticles(
  data: Record<string, unknown>,
  withSignals: boolean
): NewsArticle[] {
  const articles = data?.articles as Record<string, string>[] | null;
  if (!articles?.length) return [];
  return articles.map((a): NewsArticle => ({
    title:     a.title     ?? "",
    url:       a.url       ?? "",
    source:    a.domain    ?? a.source ?? "",
    seen_date: a.seendate  ?? a.seen_date ?? "",
    language:  a.language  ?? "English",
    tone:      parseFloat(a.tone ?? "0"),
    ...(withSignals ? { signals: tagSignals(a.title ?? "") } : {}),
  }));
}

export async function fetchEnergyNews(): Promise<NewsArticle[]> {
  const r = await fetch(`${BASE}news-energy.json`, {
    cache: "no-cache",
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`news-energy ${r.status}`);
  return parseArticles(await r.json(), true);
}

export async function fetchGlobalNews(): Promise<NewsArticle[]> {
  const r = await fetch(`${BASE}news-global.json`, {
    cache: "no-cache",
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) throw new Error(`news-global ${r.status}`);
  return parseArticles(await r.json(), false);
}
