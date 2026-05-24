import type { EnergyPrices, InventoryData, NewsArticle } from "../types";

const EIA_KEY = import.meta.env.VITE_EIA_API_KEY || "DEMO_KEY";
const EIA = "https://api.eia.gov/v2";
const GDELT = "https://api.gdeltproject.org/api/v2/doc/doc";

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

// ─── EIA ヘルパー ─────────────────────────────────────────────────────────────
function eiaUrl(route: string, series: string, freq = "daily", len = 2): string {
  return (
    `${EIA}/${route}/data/?api_key=${EIA_KEY}` +
    `&frequency=${freq}&data[0]=value` +
    `&facets[series][]=${series}` +
    `&sort[0][column]=period&sort[0][direction]=desc&length=${len}`
  );
}

function parseRows(
  rows: { value: string; period: string }[] | undefined,
  dec: number
): { price: number; period: string; change: number } | null {
  if (!rows?.length) return null;
  try {
    const cur = parseFloat(rows[0].value);
    const prev = rows[1] ? parseFloat(rows[1].value) : cur;
    const factor = 10 ** dec;
    return {
      price: Math.round(cur * factor) / factor,
      period: rows[0].period,
      change: Math.round((cur - prev) * factor) / factor,
    };
  } catch {
    return null;
  }
}

async function eiaFetch(url: string) {
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`EIA ${r.status}`);
  return r.json();
}

async function gdeltFetch(url: string) {
  const r = await fetch(url, { signal: AbortSignal.timeout(9000) });
  if (!r.ok) throw new Error(`GDELT ${r.status}`);
  return r.json();
}

// ─── 公開API ─────────────────────────────────────────────────────────────────
export async function fetchEnergyPrices(): Promise<EnergyPrices> {
  const result: EnergyPrices = { wti: null, brent: null, henry_hub: null, gasoline: null };

  await Promise.allSettled([
    eiaFetch(eiaUrl("petroleum/pri/spt", "EER_EPCWTI_PF4_Y35NY_DPG")).then((d) => {
      const p = parseRows(d?.response?.data, 2);
      if (p) result.wti = { ...p, unit: "USD/barrel" };
    }),
    eiaFetch(eiaUrl("petroleum/pri/spt", "EER_EPCO_PF4_Y35NY_DPG")).then((d) => {
      const p = parseRows(d?.response?.data, 2);
      if (p) result.brent = { ...p, unit: "USD/barrel" };
    }),
    eiaFetch(eiaUrl("natural-gas/pri/sum", "RNGWHHD")).then((d) => {
      const p = parseRows(d?.response?.data, 3);
      if (p) result.henry_hub = { ...p, unit: "USD/MMBtu" };
    }),
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

const ENERGY_Q = encodeURIComponent(
  [
    '"OPEC"', '"Hormuz"', '"Saudi Arabia"', '"UAE"', '"ADNOC"',
    '"shale oil"', '"shale gas"', '"LNG"', '"crude oil"', '"oil price"',
    '"Brent crude"', '"WTI"', '"natural gas price"', '"petroleum"',
    '"oil supply"', '"production cut"', '"Iran oil"', '"Russian oil"',
  ].join(" OR ")
);

const GLOBAL_Q = encodeURIComponent(
  ["war", "conflict", "sanctions", "military", "ceasefire", "missile", "diplomacy", "geopolitical"].join(
    " OR "
  )
);

export async function fetchEnergyNews(): Promise<NewsArticle[]> {
  const url = `${GDELT}?query=${ENERGY_Q}&mode=ArtList&maxrecords=50&format=json&timespan=24h&sort=HybridRel`;
  const d = await gdeltFetch(url);
  return (d?.articles ?? []).map(
    (a: Record<string, string>): NewsArticle => ({
      title: a.title ?? "",
      url: a.url ?? "",
      source: a.domain ?? "",
      seen_date: a.seendate ?? "",
      language: a.language ?? "English",
      tone: parseFloat(a.tone ?? "0"),
      signals: tagSignals(a.title ?? ""),
    })
  );
}

export async function fetchGlobalNews(): Promise<NewsArticle[]> {
  const url = `${GDELT}?query=${GLOBAL_Q}&mode=ArtList&maxrecords=30&format=json&timespan=12h&sort=DateDesc`;
  const d = await gdeltFetch(url);
  return (d?.articles ?? []).map(
    (a: Record<string, string>): NewsArticle => ({
      title: a.title ?? "",
      url: a.url ?? "",
      source: a.domain ?? "",
      seen_date: a.seendate ?? "",
      language: a.language ?? "English",
      tone: parseFloat(a.tone ?? "0"),
    })
  );
}
