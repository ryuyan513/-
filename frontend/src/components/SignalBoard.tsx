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
    risk: "HIGH",
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
    badge: "bg-navy-800 text-slate-500",
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
      className={`relative border rounded-lg p-2 sm:p-3 cursor-pointer transition-all duration-200 ${s.card} touch-manipulation`}
      onClick={() => setExpanded(!expanded)}
      style={{ minHeight: 80 }}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm shrink-0">{sig.icon}</span>
          <div className="min-w-0">
            <div className={`text-[11px] sm:text-xs font-bold leading-tight ${s.label} truncate`}>
              {sig.nameJa}
            </div>
            <div className="text-[9px] text-slate-500 leading-tight hidden sm:block">
              {sig.nameEn}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            <span className={`text-[8px] sm:text-[9px] font-bold tracking-wide ${s.label}`}>
              {s.risk}
            </span>
          </div>
          <span className={`text-[9px] px-1 py-0.5 rounded ${s.badge}`}>
            {sig.count}件
          </span>
        </div>
      </div>

      {/* センチメント表示: sm以上 */}
      {sig.count > 0 && (
        <div className="mt-1 text-[9px] text-slate-500 hidden sm:block">
          感情:{" "}
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

      {/* 展開ヘッドライン */}
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
        <div className="absolute bottom-1 right-1.5 text-[8px] text-slate-600">
          {expanded ? "▲" : "▼"}
        </div>
      )}
    </div>
  );
}

function SkeletonSignal() {
  return (
    <div className="border border-navy-700 rounded-lg p-2 sm:p-3 bg-navy-900 animate-pulse" style={{ minHeight: 80 }}>
      <div className="flex justify-between">
        <div className="h-3.5 bg-navy-700 rounded w-16" />
        <div className="h-3.5 bg-navy-700 rounded w-10" />
      </div>
      <div className="h-3 bg-navy-700 rounded w-full mt-3" />
    </div>
  );
}

export default function SignalBoard({ signals, loading }: Props) {
  const alertCount = signals.filter((s) => s.level === "red").length;
  const warnCount = signals.filter((s) => s.level === "yellow").length;

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-2.5 sm:p-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">🚨</span>
          <h2 className="text-amber-400 font-bold text-[11px] sm:text-xs tracking-widest uppercase">
            地政学シグナル
          </h2>
          <span className="text-slate-500 text-[10px] hidden sm:inline">/ Geopolitical Signals — 過去24時間</span>
        </div>
        {!loading && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {alertCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-900/60 border border-red-700 rounded text-red-300 font-bold text-[9px] sm:text-[10px]">
                🔴 HIGH ×{alertCount}
              </span>
            )}
            {warnCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-900/60 border border-amber-700 rounded text-amber-300 font-bold text-[9px] sm:text-[10px]">
                🟡 ELEVATED ×{warnCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/*
        モバイル: 2列
        タブレット: 4列
        PC: 7列（全シグナルを1行で表示）
      */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonSignal key={i} />)
          : signals.map((sig) => <SignalCard key={sig.id} sig={sig} />)}
      </div>
    </div>
  );
}
