import type { NewsArticle } from "../types";

interface Props {
  articles: NewsArticle[];
  loading: boolean;
}

const SIGNAL_LABELS: Record<string, { ja: string; color: string }> = {
  hormuz:  { ja: "🚢ホルムズ",    color: "bg-red-900/60 text-red-300 border-red-700" },
  opec:    { ja: "🛢️OPEC",       color: "bg-amber-900/60 text-amber-300 border-amber-700" },
  saudi:   { ja: "🇸🇦サウジ",     color: "bg-orange-900/60 text-orange-300 border-orange-700" },
  uae:     { ja: "🇦🇪UAE",        color: "bg-sky-900/60 text-sky-300 border-sky-700" },
  shale:   { ja: "⛏️シェール",   color: "bg-emerald-900/60 text-emerald-300 border-emerald-700" },
  iran:    { ja: "⚠️イラン",      color: "bg-rose-900/60 text-rose-300 border-rose-700" },
  lng:     { ja: "🔵LNG",         color: "bg-blue-900/60 text-blue-300 border-blue-700" },
};

function parseSeen(seen: string): string {
  if (!seen || seen.length < 15) return "";
  try {
    const y = seen.slice(0, 4);
    const mo = seen.slice(4, 6);
    const d = seen.slice(6, 8);
    const h = seen.slice(9, 11);
    const mi = seen.slice(11, 13);
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:00Z`);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}分前`;
    if (diff < 1440) return `${Math.floor(diff / 60)}時間前`;
    return `${Math.floor(diff / 1440)}日前`;
  } catch {
    return "";
  }
}

function toneBar(tone: number) {
  const clamped = Math.max(-10, Math.min(10, tone));
  const color =
    clamped < -3
      ? "bg-red-500"
      : clamped < -1
      ? "bg-orange-500"
      : clamped < 1
      ? "bg-slate-500"
      : "bg-emerald-500";
  const pct = Math.round(((clamped + 10) / 20) * 100);
  return { color, pct };
}

function ArticleRow({ a }: { a: NewsArticle }) {
  const { color, pct } = toneBar(a.tone);
  const relTime = parseSeen(a.seen_date);
  const signals = a.signals ?? [];

  return (
    <div className="px-3 py-2.5 border-b border-navy-700 last:border-0 hover:bg-navy-800/50 transition-colors group animate-fade-in">
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
          <div className="w-1 h-8 bg-navy-700 rounded-full overflow-hidden">
            <div
              className={`w-full rounded-full ${color} transition-all`}
              style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-slate-200 group-hover:text-white leading-snug line-clamp-2 hover:underline underline-offset-2"
          >
            {a.title}
          </a>

          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            <span className="text-[10px] text-slate-500">{a.source}</span>
            {relTime && (
              <span className="text-[10px] text-slate-600">{relTime}</span>
            )}
            {signals.map((sig) => {
              const sl = SIGNAL_LABELS[sig];
              if (!sl) return null;
              return (
                <span
                  key={sig}
                  className={`text-[9px] px-1.5 py-0.5 border rounded leading-none font-bold ${sl.color}`}
                >
                  {sl.ja}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="px-3 py-2.5 border-b border-navy-700 last:border-0 animate-pulse">
      <div className="h-3 bg-navy-700 rounded w-full mb-2" />
      <div className="h-3 bg-navy-700 rounded w-3/4 mb-2" />
      <div className="h-2.5 bg-navy-700 rounded w-24" />
    </div>
  );
}

export default function EnergyNewsFeed({ articles, loading }: Props) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-navy-700 flex items-center justify-between bg-navy-800/50">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <h2 className="text-amber-400 font-bold text-xs tracking-widest uppercase">
            石油・ガス・LNG ニュース
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>Energy News</span>
          <span className="text-slate-600">/ 過去24時間</span>
          {!loading && (
            <span className="text-slate-400">{articles.length}件</span>
          )}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[600px] flex-1">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
        ) : articles.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
            ニュースを取得中 / Fetching news…
          </div>
        ) : (
          articles.map((a, i) => <ArticleRow key={`${a.url}-${i}`} a={a} />)
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-navy-700 bg-navy-800/30 text-[9px] text-slate-600 flex items-center gap-1">
        <span>データソース:</span>
        <span className="text-slate-500">GDELT Project DOC 2.0 API</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> 否定的
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 ml-1" /> 中立
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" /> 肯定的
        </span>
      </div>
    </div>
  );
}
