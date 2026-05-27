import { useState, lazy, Suspense } from "react";
import { CHOKEPOINTS } from "../data/mapData";

const Map2D = lazy(() => import("./Map2D"));
const Map3D = lazy(() => import("./Map3D"));

const RISK_COLOR: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };

function LoadingOverlay({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full text-slate-600 text-sm animate-pulse">
      {label} 読み込み中…
    </div>
  );
}

export default function MapPanel() {
  const [view, setView] = useState<"2D" | "3D">("2D");

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg overflow-hidden flex flex-col" style={{ height: 480 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-navy-700 bg-navy-800/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">🌍</span>
          <h2 className="text-cyan-400 font-bold text-[11px] sm:text-xs tracking-widest uppercase">
            エネルギーインフラ地図
          </h2>
          <span className="text-slate-500 text-[10px] hidden sm:inline">/ Energy Infrastructure Map</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Chokepoint summary badges */}
          <div className="hidden sm:flex items-center gap-1">
            {CHOKEPOINTS.filter((c) => c.risk === "HIGH").map((c) => (
              <span key={c.id} className="text-[9px] px-1.5 py-0.5 bg-red-900/60 border border-red-700 rounded text-red-300 font-bold">
                ⚠ {c.en.split(" ")[0]}
              </span>
            ))}
          </div>

          {/* 2D / 3D toggle */}
          <div className="flex rounded overflow-hidden border border-navy-600">
            {(["2D", "3D"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-[11px] font-bold transition-colors ${
                  view === v
                    ? "bg-cyan-600 text-white"
                    : "bg-navy-800 text-slate-400 hover:bg-navy-700"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        <Suspense fallback={<LoadingOverlay label={view === "2D" ? "2D マップ" : "3D グローブ"} />}>
          {view === "2D" ? <Map2D /> : <Map3D />}
        </Suspense>
      </div>

      {/* Chokepoint status bar */}
      <div className="px-3 py-1.5 border-t border-navy-700 bg-navy-800/30 flex items-center gap-2 flex-wrap shrink-0">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">CHOKEPOINT</span>
        {CHOKEPOINTS.map((cp) => (
          <div key={cp.id} className="flex items-center gap-1 text-[9px]">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: RISK_COLOR[cp.risk] }} />
            <span className="text-slate-400">{cp.en.split(" ")[0]}</span>
            <span className="text-[8px] font-bold" style={{ color: RISK_COLOR[cp.risk] }}>{cp.risk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
