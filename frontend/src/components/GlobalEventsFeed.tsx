import type { NewsArticle } from "../types";

interface Props {
  articles: NewsArticle[];
  loading: boolean;
}

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

function toneDot(tone: number) {
  if (tone < -3) return { cls: "bg-red-500", label: "⚠" };
  if (tone < -1) return { cls: "bg-orange-500", label: "!" };
  if (tone > 1) return { cls: "bg-emerald-500", label: "+" };
  return { cls: "bg-slate-500", label: "·" };
}

function EventRow({ a }: { a: NewsArticle }) {
  const relTime = parseSeen(a.seen_date);
  const { cls, label } = toneDot(a.tone);

  return (
    <div className="px-3 py-2 border-b border-navy-700 last:border-0 hover:bg-navy-800/40 transition-colors group animate-fade-in">
      <div className="flex items-start gap-2">
        <span
          className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${cls} text-white`}
        >
          {label}
        </span>

        <div className="flex-1 min-w-0">
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-slate-300 group-hover:text-white leading-snug line-clamp-2 hover:underline underline-offset-2"
          >
            {a.title}
          </a>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-500">{a.source}</span>
            {relTime && (
              <span className="text-[10px] text-slate-600">{relTime}</span>
            )}
            {a.language && a.language !== "English" && (
              <span className="text-[9px] px-1 py-0.5 bg-navy-700 rounded text-slate-400">
                {a.language}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="px-3 py-2 border-b border-navy-700 last:border-0 animate-pulse">
      <div className="h-3 bg-navy-700 rounded w-full mb-2" />
      <div className="h-3 bg-navy-700 rounded w-2/3 mb-2" />
      <div className="h-2.5 bg-navy-700 rounded w-20" />
    </div>
  );
}

export default function GlobalEventsFeed({ articles, loading }: Props) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-navy-700 flex items-center justify-between bg-navy-800/50">
        <div className="flex items-center gap-2">
          <span className="text-sm">🌐</span>
          <h2 className="text-blue-400 font-bold text-xs tracking-widest uppercase">
            世界情勢
          </h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>Global Events</span>
          <span className="text-slate-600">/ 過去12時間</span>
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
            ニュースを取得中…
          </div>
        ) : (
          articles.map((a, i) => <EventRow key={`${a.url}-${i}`} a={a} />)
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-navy-700 bg-navy-800/30 text-[9px] text-slate-600 flex items-center gap-1">
        <span>データソース:</span>
        <span className="text-slate-500">GDELT Project DOC 2.0 API</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="bg-red-500 w-1.5 h-1.5 rounded-full" />⚠ 懸念
          <span className="bg-slate-500 w-1.5 h-1.5 rounded-full ml-1" />· 中立
          <span className="bg-emerald-500 w-1.5 h-1.5 rounded-full ml-1" />+ 良好
        </span>
      </div>
    </div>
  );
}
