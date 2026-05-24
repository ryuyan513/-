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
    <header className="bg-navy-900 border-b border-navy-700 px-3 py-2 flex items-center justify-between gap-2">
      {/* ロゴ・タイトル */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg sm:text-xl shrink-0">🌍</span>
        <div className="min-w-0">
          <h1 className="text-amber-400 font-bold text-xs sm:text-sm leading-tight tracking-wider truncate">
            {/* モバイル: 短縮タイトル / デスクトップ: フルタイトル */}
            <span className="sm:hidden">エネルギー監視</span>
            <span className="hidden sm:inline">世界エネルギー監視ダッシュボード</span>
          </h1>
          <p className="hidden sm:block text-navy-600 text-[10px] leading-tight tracking-widest">
            WORLD ENERGY INTELLIGENCE MONITOR
          </p>
        </div>
        {/* LIVEバッジ */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
          <span className="text-emerald-400 text-[9px] sm:text-[10px] tracking-wider font-bold">LIVE</span>
        </div>
      </div>

      {/* 右側コントロール */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 最終更新時刻: タブレット以上で表示 */}
        <div className="hidden md:flex flex-col items-end gap-0.5">
          <span className="text-slate-500 text-[10px]">最終更新</span>
          <span className="text-slate-300 text-[11px]">
            {lastUpdated ? fmt(lastUpdated) : "---"}
          </span>
        </div>

        {/* カウントダウンバー: sm以上で表示 */}
        <div className="hidden sm:flex flex-col items-center gap-0.5 w-12">
          <div className="w-full h-1 bg-navy-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-slate-500 text-[9px]">
            {countdown > 0 ? `${countdown}s` : "…"}
          </span>
        </div>

        {/* 更新ボタン */}
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 bg-navy-800 hover:bg-navy-700 border border-navy-600 rounded text-slate-300 hover:text-white transition-colors touch-manipulation"
          title="今すぐ更新 / Refresh now"
          style={{ minHeight: 36 }}
        >
          <span className="text-sm">↻</span>
          <span className="hidden sm:inline text-[11px]">更新</span>
        </button>
      </div>
    </header>
  );
}
