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
  color: string;
  value: number | null;
  change: number | null;
  unit: string;
  period?: string;
  decimals?: number;
  valuePrefix?: string;
  changeSuffix?: string;
}

function PriceCard({
  label,
  sublabel,
  color,
  value,
  change,
  unit,
  period,
  decimals = 2,
  valuePrefix = "$",
}: CardProps) {
  const up = change !== null && change > 0;
  const dn = change !== null && change < 0;
  const arrow = up ? "▲" : dn ? "▼" : "—";
  const changeColor = up ? "text-emerald-400" : dn ? "text-red-400" : "text-slate-500";

  return (
    <div
      className={`flex-1 min-w-[140px] bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 flex flex-col gap-1 hover:border-${color} transition-colors`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold tracking-widest text-${color} uppercase`}>
          {label}
        </span>
        {period && (
          <span className="text-[9px] text-slate-600">{period}</span>
        )}
      </div>
      <span className="text-[10px] text-slate-500 leading-none">{sublabel}</span>

      {value !== null ? (
        <>
          <span className="text-lg font-bold text-white leading-tight">
            {valuePrefix}
            {value.toFixed(decimals)}
          </span>
          <div className={`flex items-center gap-1 text-xs ${changeColor}`}>
            <span>{arrow}</span>
            <span>
              {change !== null
                ? `${Math.abs(change).toFixed(decimals)}`
                : "---"}
            </span>
          </div>
        </>
      ) : (
        <span className="text-slate-600 text-sm mt-1">N/A</span>
      )}

      <span className="text-[9px] text-slate-600 mt-0.5">{unit}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex-1 min-w-[140px] bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 animate-pulse">
      <div className="h-2.5 bg-navy-700 rounded w-16 mb-2" />
      <div className="h-6 bg-navy-700 rounded w-24 mb-1" />
      <div className="h-2.5 bg-navy-700 rounded w-12" />
    </div>
  );
}

export default function EnergyPricePanel({ prices, inventory, apiKeySet, loading }: Props) {
  const stock = inventory?.us_crude_stock;

  return (
    <div className="px-3 py-2 border-b border-navy-700 bg-navy-950">
      {!apiKeySet && !loading && (
        <div className="mb-2 text-[10px] text-amber-500 bg-amber-950/40 border border-amber-800/40 rounded px-3 py-1.5">
          ⚠️ EIA価格データを取得するには <strong>EIA_API_KEY</strong> の設定が必要です。
          <a
            href="https://www.eia.gov/opendata/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline ml-1"
          >
            無料登録はこちら →
          </a>
          　DEMO_KEY では1日100リクエストの制限あり。
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <PriceCard
              label="WTI原油"
              sublabel="Cushing, OK"
              color="amber-400"
              value={prices?.wti?.price ?? null}
              change={prices?.wti?.change ?? null}
              unit="USD / barrel"
              period={prices?.wti?.period}
            />
            <PriceCard
              label="ブレント原油"
              sublabel="Europe Brent"
              color="blue-400"
              value={prices?.brent?.price ?? null}
              change={prices?.brent?.change ?? null}
              unit="USD / barrel"
              period={prices?.brent?.period}
            />
            <PriceCard
              label="天然ガス"
              sublabel="Henry Hub"
              color="emerald-400"
              value={prices?.henry_hub?.price ?? null}
              change={prices?.henry_hub?.change ?? null}
              unit="USD / MMBtu"
              period={prices?.henry_hub?.period}
              decimals={3}
            />
            <PriceCard
              label="ガソリン"
              sublabel="US Regular (週次)"
              color="purple-400"
              value={prices?.gasoline?.price ?? null}
              change={prices?.gasoline?.change ?? null}
              unit="USD / gallon"
              period={prices?.gasoline?.period}
              decimals={3}
            />
            <div className="flex-1 min-w-[140px] bg-navy-900 border border-navy-700 rounded-lg px-3 py-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-widest text-orange-300 uppercase">
                  米原油在庫
                </span>
                {stock?.period && (
                  <span className="text-[9px] text-slate-600">{stock.period}</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 leading-none">US Crude Stock (週次)</span>

              {stock ? (
                <>
                  <span className="text-lg font-bold text-white leading-tight">
                    {(stock.price / 1000).toFixed(1)}
                    <span className="text-sm font-normal text-slate-400 ml-1">M bbl</span>
                  </span>
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      stock.change > 0
                        ? "text-red-400"    // 在庫増 = 需要懸念
                        : stock.change < 0
                        ? "text-emerald-400" // 在庫減 = 需要強い
                        : "text-slate-500"
                    }`}
                  >
                    <span>{stock.change > 0 ? "▲" : stock.change < 0 ? "▼" : "—"}</span>
                    <span>{Math.abs(stock.change / 1000).toFixed(1)} M bbl</span>
                  </div>
                </>
              ) : (
                <span className="text-slate-600 text-sm mt-1">N/A</span>
              )}
              <span className="text-[9px] text-slate-600 mt-0.5">EIA 週次データ</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
