interface Props {
  lastUpdated: Date | null;
  countdown: number;
  onRefresh: () => void;
}

function fmt(d: Date): string {
  return d.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function Header({ lastUpdated, countdown, onRefresh }: Props) {
  const pct = Math.round((countdown / 300) * 100);

  return (
    <header className="bg-navy-900 border-b border-navy-700 px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0">🌍</span>
        <div className="min-w-0">
          <h1 className="text-amber-400 font-bold text-sm leading-tight tracking-wider whitespace-nowrap">
            世界エネルギー監視ダッシュボード
          </h1>
          <p className="text-navy-600 text-[10px] leading-tight tracking-widest">
            WORLD ENERGY INTELLIGENCE MONITOR
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 ml-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
          <span className="text-emerald-400 text-[10px] tracking-wider">LIVE</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 text-[11px]">
        <div className="hidden md:flex flex-col items-end gap-0.5">
          <span className="text-slate-500">最終更新 / Last Update</span>
          <span className="text-slate-300">
            {lastUpdated ? fmt(lastUpdated) : "---"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-0.5 w-14">
          <div className="w-full h-1 bg-navy-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-slate-500 text-[10px]">
            {countdown > 0 ? `${countdown}s` : "updating…"}
          </span>
        </div>

        <button
          onClick={onRefresh}
          className="px-2.5 py-1 bg-navy-800 hover:bg-navy-700 border border-navy-600 rounded text-[11px] text-slate-300 hover:text-white transition-colors"
          title="今すぐ更新 / Refresh now"
        >
          ↻ 更新
        </button>
      </div>
    </header>
  );
}
