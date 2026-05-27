import type { NewsArticle } from "../types";

interface Props {
  articles: NewsArticle[];
  loading: boolean;
}

function parseSeen(seen: string): string {
  if (!seen) return "";
  try {
    let date: Date;
    if (/^\d{8}T\d{6}Z$/.test(seen)) {
      date = new Date(
        `${seen.slice(0, 4)}-${seen.slice(4, 6)}-${seen.slice(6, 8)}T${seen.slice(9, 11)}:${seen.slice(11, 13)}:00Z`
      );
    } else {
      date = new Date(seen);
    }
    if (isNaN(date.getTime())) return "";
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 0) return "";
    if (diff < 60) return `${diff}分前`;
    if (diff < 1440) return `${Math.floor(diff / 60)}時間前`;
    return `${Math.floor(diff / 1440)}日前`;
  } catch {
    return "";
  }
}

function toneDot(tone: number) {
  if (tone < -3) return { cls: "bg-red-500", label: "⚠", text: "text-red-400" };
  if (tone < -1) return { cls: "bg-orange-500", label: "!", text: "text-orange-400" };
  if (tone > 1)  return { cls: "bg-emerald-500", label: "+", text: "text-emerald-400" };
  return { cls: "bg-slate-500", label: "·", text: "text-slate-400" };
}

function EventRow({ a }: { a: NewsArticle }) {
  const relTime = parseSeen(a.seen_date);
  const { cls, label, text } = toneDot(a.tone);

  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 px-3 py-3 border-b border-navy-700 last:border-0 hover:bg-navy-800/40 active:bg-navy-800 transition-colors group animate-fade-in touch-manipulation"
      style={{ minHeight: 52 }}
    >
      <span
        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${cls} text-white`}
      >
        {label}
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-[12px] sm:text-[13px] text-slate-300 group-hover:text-white leading-snug line-clamp-2 ${text}`}>
          {a.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-slate-500">{a.source}</span>
          {relTime && <span className="text-[10px] text-slate-600">{relTime}</span>}
          {a.language && a.language !== "English" && (
            <span className="text-[9px] px-1 py-0.5 bg-navy-700 rounded text-slate-400">
              {a.language}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

function SkeletonRow() {
  return (
    <div className="px-3 py-3 border-b border-navy-700 last:border-0 animate-pulse">
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
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🌐</span>
          <h2 className="text-blue-400 font-bold text-[11px] sm:text-xs tracking-widest uppercase">
            世界情勢
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="hidden sm:inline">Global Events</span>
          <span className="text-slate-600">12h</span>
          {!loading && <span className="text-slate-400">{articles.length}件</span>}
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: "min(60vh, 560px)" }}>
        {loading ? (
          Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)
        ) : articles.length === 0 ? (
          <div className="flex items-center justify-center h-28 text-slate-600 text-sm">
            記事なし（24h以内の取得）
          </div>
        ) : (
          articles.map((a, i) => <EventRow key={`${a.url}-${i}`} a={a} />)
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-navy-700 bg-navy-800/30 text-[9px] text-slate-600 flex items-center gap-1 flex-wrap">
        <span>Source: GDELT DOC 2.0 API</span>
        <span className="ml-auto flex items-center gap-1">
          <span className="bg-red-500 w-1.5 h-1.5 rounded-full" />⚠ 懸念
          <span className="bg-emerald-500 w-1.5 h-1.5 rounded-full ml-1" />+ 良好
        </span>
      </div>
    </div>
  );
}
