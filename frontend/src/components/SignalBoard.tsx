import { useState } from "react";
import type { Signal } from "../types";

interface Props {
  signals: Signal[];
  loading: boolean;
}

const LEVEL_STYLES = {
  red: {
    card: "bg-red-950/40 border-red-700 border-glow-red",
    dot: "bg-red-500 animate-pulse",
    badge: "bg-red-900/60 text-red-300",
    label: "text-red-400",
    risk: "HIGH RISK",
    riskJa: "高リスク",
  },
  yellow: {
    card: "bg-amber-950/30 border-amber-700 border-glow-yellow",
    dot: "bg-amber-400 animate-pulse-slow",
    badge: "bg-amber-900/60 text-amber-300",
    label: "text-amber-400",
    risk: "ELEVATED",
    riskJa: "注意",
  },
  green: {
    card: "bg-emerald-950/20 border-emerald-800",
    dot: "bg-emerald-500",
    badge: "bg-emerald-900/50 text-emerald-300",
    label: "text-emerald-400",
    risk: "NORMAL",
    riskJa: "平常",
  },
  gray: {
    card: "bg-navy-900 border-navy-700",
    dot: "bg-slate-600",
    badge: "bg-navy-800 text-slate-400",
    label: "text-slate-500",
    risk: "QUIET",
    riskJa: "動静なし",
  },
};

function SignalCard({ sig }: { sig: Signal }) {
  const [expanded, setExpanded] = useState(false);
  const s = LEVEL_STYLES[sig.level];

  return (
    <div
      className={`relative border rounded-lg p-3 cursor-pointer transition-all duration-200 ${s.card}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{sig.icon}</span>
          <div className="min-w-0">
            <div className={`text-xs font-bold leading-tight ${s.label}`}>
              {sig.nameJa}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              {sig.nameEn}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
            <span className={`text-[9px] font-bold tracking-wider ${s.label}`}>
              {s.risk}
            </span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.badge}`}>
            {sig.count} 記事
          </span>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-slate-500 leading-snug">{sig.desc}</div>

      {sig.count > 0 && (
        <div className="mt-1.5 text-[10px] text-slate-500">
          平均センチメント:{" "}
          <span
            className={
              sig.avgTone < -2
                ? "text-red-400"
                : sig.avgTone < 0
                ? "text-amber-400"
                : "text-emerald-400"
            }
          >
            {sig.avgTone > 0 ? "+" : ""}
            {sig.avgTone}
          </span>
        </div>
      )}

      {expanded && sig.headlines.length > 0 && (
        <div className="mt-2 pt-2 border-t border-navy-700 space-y-1">
          {sig.headlines.map((h, i) => (
            <p key={i} className="text-[10px] text-slate-400 leading-snug line-clamp-2">
              • {h}
            </p>
          ))}
        </div>
      )}

      {sig.headlines.length > 0 && (
        <div className="absolute bottom-1.5 right-2 text-[9px] text-slate-600">
          {expanded ? "▲ 閉じる" : "▼ 最新記事"}
        </div>
      )}
    </div>
  );
}

function SkeletonSignal() {
  return (
    <div className="border border-navy-700 rounded-lg p-3 bg-navy-900 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 bg-navy-700 rounded w-24" />
        <div className="h-4 bg-navy-700 rounded w-12" />
      </div>
      <div className="h-3 bg-navy-700 rounded w-full mt-3" />
    </div>
  );
}

export default function SignalBoard({ signals, loading }: Props) {
  const alertCount = signals.filter((s) => s.level === "red").length;
  const warnCount = signals.filter((s) => s.level === "yellow").length;

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🚨</span>
          <h2 className="text-amber-400 font-bold text-xs tracking-widest uppercase">
            地政学シグナル / Geopolitical Signals
          </h2>
          <span className="text-slate-500 text-[10px]">— 過去24時間</span>
        </div>
        {!loading && (
          <div className="flex items-center gap-2 text-[10px]">
            {alertCount > 0 && (
              <span className="px-2 py-0.5 bg-red-900/60 border border-red-700 rounded text-red-300 font-bold">
                🔴 HIGH RISK ×{alertCount}
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-900/60 border border-amber-700 rounded text-amber-300 font-bold">
                🟡 ELEVATED ×{warnCount}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonSignal key={i} />)
          : signals.map((sig) => <SignalCard key={sig.id} sig={sig} />)}
      </div>
    </div>
  );
}
