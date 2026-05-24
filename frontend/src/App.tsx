import { useState, useEffect, useCallback, useRef } from "react";
import Header from "./components/Header";
import EnergyPricePanel from "./components/EnergyPricePanel";
import SignalBoard from "./components/SignalBoard";
import EnergyNewsFeed from "./components/EnergyNewsFeed";
import GlobalEventsFeed from "./components/GlobalEventsFeed";
import {
  fetchEnergyPrices,
  fetchInventory,
  fetchEnergyNews,
  fetchGlobalNews,
} from "./services/api";
import type { EnergyPrices, InventoryData, NewsArticle, Signal, SignalDef } from "./types";

const REFRESH_MS = 5 * 60 * 1000;

const API_KEY_SET =
  !!import.meta.env.VITE_EIA_API_KEY &&
  import.meta.env.VITE_EIA_API_KEY !== "DEMO_KEY";

const SIGNAL_DEFS: SignalDef[] = [
  { id: "hormuz", nameJa: "ホルムズ海峡", nameEn: "Hormuz Strait",     icon: "🚢", desc: "世界石油の約20%が通過する海峡" },
  { id: "opec",   nameJa: "OPEC / OPEC+", nameEn: "OPEC / OPEC+",     icon: "🛢️", desc: "世界最大の産油国カルテル" },
  { id: "saudi",  nameJa: "サウジアラビア", nameEn: "Saudi Arabia",    icon: "🇸🇦", desc: "世界最大の原油輸出国" },
  { id: "uae",    nameJa: "UAE",           nameEn: "UAE / Abu Dhabi",   icon: "🇦🇪", desc: "中東の主要産油国・ADNOC" },
  { id: "shale",  nameJa: "米シェール",    nameEn: "US Shale",          icon: "⛏️", desc: "米国の非在来型石油生産" },
  { id: "iran",   nameJa: "イラン / 制裁", nameEn: "Iran / Sanctions",  icon: "⚠️", desc: "供給リスク・制裁動向" },
  { id: "lng",    nameJa: "LNG",           nameEn: "LNG Market",        icon: "🔵", desc: "液化天然ガス市場・輸送" },
];

function computeSignals(articles: NewsArticle[]): Signal[] {
  return SIGNAL_DEFS.map((def) => {
    const matching = articles.filter((a) => a.signals?.includes(def.id));
    const count = matching.length;
    const avgTone =
      count > 0
        ? Math.round((matching.reduce((s, a) => s + a.tone, 0) / count) * 10) / 10
        : 0;

    let level: Signal["level"] = "gray";
    if (count === 0) level = "gray";
    else if (count >= 4 && avgTone < -2.5) level = "red";
    else if (count >= 2 || avgTone < -1.5) level = "yellow";
    else level = "green";

    return { ...def, count, avgTone, level, headlines: matching.slice(0, 3).map((a) => a.title) };
  });
}

export default function App() {
  const [prices, setPrices] = useState<EnergyPrices | null>(null);
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [energyNews, setEnergyNews] = useState<NewsArticle[]>([]);
  const [globalNews, setGlobalNews] = useState<NewsArticle[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000);
  const countRef = useRef(REFRESH_MS / 1000);

  const fetchAll = useCallback(async () => {
    try {
      const [priceRes, invRes, energyRes, globalRes] = await Promise.allSettled([
        fetchEnergyPrices(),
        fetchInventory(),
        fetchEnergyNews(),
        fetchGlobalNews(),
      ]);

      if (priceRes.status === "fulfilled") setPrices(priceRes.value);
      if (invRes.status === "fulfilled") setInventory(invRes.value);
      if (energyRes.status === "fulfilled") {
        const arts = energyRes.value;
        setEnergyNews(arts);
        setSignals(computeSignals(arts));
      }
      if (globalRes.status === "fulfilled") setGlobalNews(globalRes.value);

      setLastUpdated(new Date());
      countRef.current = REFRESH_MS / 1000;
      setCountdown(REFRESH_MS / 1000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    const id = setInterval(() => {
      countRef.current = Math.max(0, countRef.current - 1);
      setCountdown(countRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-navy-950 text-slate-200 font-mono select-none">
      <Header lastUpdated={lastUpdated} countdown={countdown} onRefresh={() => { setLoading(true); fetchAll(); }} />
      <EnergyPricePanel prices={prices} inventory={inventory} apiKeySet={API_KEY_SET} loading={loading} />
      <div className="px-2 sm:px-3 pb-4 space-y-2.5 sm:space-y-3">
        <SignalBoard signals={signals} loading={loading} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <EnergyNewsFeed articles={energyNews} loading={loading} />
          <GlobalEventsFeed articles={globalNews} loading={loading} />
        </div>
      </div>
    </div>
  );
}
