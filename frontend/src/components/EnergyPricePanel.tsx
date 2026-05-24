import type { EnergyPrices, InventoryData } from "../types";

interface Props {
  prices: EnergyPrices | null;
  inventory: InventoryData | null;
  apiKeySet: boolean;
  loading: boolean;
}

interface CardProps {
  label: string;
  sublabel: string;
  accentClass: string;
  value: number | null;
  change: number | null;
  unit: string;
  period?: string;
  decimals?: number;
  invertChange?: boolean; // 在庫は増加=ネガティブ
}

function PriceCard({
  label,
  sublabel,
  accentClass,
  value,
  change,
  unit,
  period,
  decimals = 2,
  invertChange = false,
}: CardProps) {
  const up = change !== null && change > 0;
  const dn = change !== null && change < 0;
  const isPositive = invertChange ? dn : up;
  const isNegative = invertChange ? up : dn;
  const arrow = up ? "▲" : dn ? "▼" : "—";
  const changeColor = isPositive
    ? "text-emerald-400"
    : isNegative
    ? "text-red-400"
    : "text-slate-500";

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 flex flex-col gap-0.5 hover:border-opacity-80 transition-colors">
      <div className="flex items-start justify-between gap-1">
        <span className={`text-[10px] font-bold tracking-widest ${accentClass} uppercase leading-tight`}>
          {label}
        </span>
        {period && (
          <span className="text-[9px] text-slate-600 shrink-0">{period}</span>
        )}
      </div>
      <span className="text-[10px] text-slate-500 leading-none">{sublabel}</span>

      {value !== null ? (
        <>
          <span className="text-base sm:text-lg font-bold text-white leading-tight mt-0.5">
            ${value.toFixed(decimals)}
          </span>
          <div className={`flex items-center gap-0.5 text-[11px] ${changeColor}`}>
            <span>{arrow}</span>
            <span>{change !== null ? Math.abs(change).toFixed(decimals) : "---"}</span>
          </div>
        </>
      ) : (
        <span className="text-slate-600 text-sm mt-1">N/A</span>
      )}

      <span className="text-[9px] text-slate-600 mt-0.5 leading-none">{unit}</span>
    </div>
  );
}

function InventoryCard({ stock }: { stock: InventoryData["us_crude_stock"] }) {
  const up = stock && stock.change > 0;
  const dn = stock && stock.change < 0;

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 flex flex-col gap-0.5">
      <div className="flex items-start justify-between gap-1">
        <span className="text-[10px] font-bold tracking-widest text-orange-300 uppercase leading-tight">
          米原油在庫
        </span>
        {stock?.period && (
          <span className="text-[9px] text-slate-600 shrink-0">{stock.period}</span>
        )}
      </div>
      <span className="text-[10px] text-slate-500 leading-none">US Crude Stock (週次)</span>

      {stock ? (
        <>
          <span className="text-base sm:text-lg font-bold text-white leading-tight mt-0.5">
            {(stock.price / 1000).toFixed(1)}
            <span className="text-xs font-normal text-slate-400 ml-1">M bbl</span>
          </span>
          <div
            className={`flex items-center gap-0.5 text-[11px] ${
              up ? "text-red-400" : dn ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            <span>{up ? "▲" : dn ? "▼" : "—"}</span>
            <span>{Math.abs((stock.change ?? 0) / 1000).toFixed(1)} M</span>
            <span className="text-slate-600 ml-0.5 text-[9px]">{up ? "積増" : dn ? "取崩" : ""}</span>
          </div>
        </>
      ) : (
        <span className="text-slate-600 text-sm mt-1">N/A</span>
      )}

      <span className="text-[9px] text-slate-600 mt-0.5 leading-none">EIA 週次データ</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="min-w-[130px] bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 animate-pulse">
      <div className="h-2.5 bg-navy-700 rounded w-16 mb-2" />
      <div className="h-5 bg-navy-700 rounded w-20 mb-1.5" />
      <div className="h-2.5 bg-navy-700 rounded w-10" />
    </div>
  );
}

export default function EnergyPricePanel({ prices, inventory, apiKeySet, loading }: Props) {
  const stock = inventory?.us_crude_stock;

  return (
    <div className="px-3 py-2 border-b border-navy-700 bg-navy-950">
      {!apiKeySet && !loading && (
        <div className="mb-2 text-[10px] text-amber-500 bg-amber-950/40 border border-amber-800/40 rounded px-3 py-1.5 flex flex-wrap items-center gap-1">
          <span>⚠️ EIA価格: <strong>EIA_API_KEY</strong> 未設定（DEMO_KEY動作中）</span>
          <a
            href="https://www.eia.gov/opendata/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            無料登録 →
          </a>
        </div>
      )}

      {/*
        モバイル: 横スクロール（スナップ付き）
        PC (md以上): flex-wrap で折り返し
      */}
      <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0 snap-x snap-mandatory">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-[130px] shrink-0 snap-start md:flex-1">
              <SkeletonCard />
            </div>
          ))
        ) : (
          <>
            {/* WTI */}
            <div className="min-w-[130px] shrink-0 snap-start md:flex-1">
              <PriceCard
                label="WTI原油"
                sublabel="Cushing, OK"
                accentClass="text-amber-400"
                value={prices?.wti?.price ?? null}
                change={prices?.wti?.change ?? null}
                unit="USD / barrel"
                period={prices?.wti?.period}
              />
            </div>
            {/* Brent */}
            <div className="min-w-[130px] shrink-0 snap-start md:flex-1">
              <PriceCard
                label="ブレント"
                sublabel="Europe Brent"
                accentClass="text-blue-400"
                value={prices?.brent?.price ?? null}
                change={prices?.brent?.change ?? null}
                unit="USD / barrel"
                period={prices?.brent?.period}
              />
            </div>
            {/* Henry Hub */}
            <div className="min-w-[130px] shrink-0 snap-start md:flex-1">
              <PriceCard
                label="天然ガス"
                sublabel="Henry Hub"
                accentClass="text-emerald-400"
                value={prices?.henry_hub?.price ?? null}
                change={prices?.henry_hub?.change ?? null}
                unit="USD / MMBtu"
                period={prices?.henry_hub?.period}
                decimals={3}
              />
            </div>
            {/* Gasoline */}
            <div className="min-w-[130px] shrink-0 snap-start md:flex-1">
              <PriceCard
                label="ガソリン"
                sublabel="US Regular"
                accentClass="text-purple-400"
                value={prices?.gasoline?.price ?? null}
                change={prices?.gasoline?.change ?? null}
                unit="USD / gallon"
                period={prices?.gasoline?.period}
                decimals={3}
              />
            </div>
            {/* Inventory */}
            <div className="min-w-[130px] shrink-0 snap-start md:flex-1">
              <InventoryCard stock={stock ?? null} />
            </div>
          </>
        )}
      </div>

      {/* モバイル用スクロールヒント */}
      <p className="md:hidden text-[9px] text-slate-600 mt-1 text-center">
        ← 横スクロールで全項目表示 →
      </p>
    </div>
  );
}
