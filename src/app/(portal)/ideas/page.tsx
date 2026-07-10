import Link from "next/link";
import { getDB } from "@/lib/store";
import { voteIdea, addIdea } from "@/lib/actions";

const STATUS_STYLE: Record<string, string> = {
  열림: "bg-slate-100 text-slate-500",
  검토중: "bg-amber-soft text-amber",
  채택: "bg-ok-soft text-ok",
  보류: "bg-slate-100 text-slate-400",
};

export default function IdeasPage() {
  const ideas = [...getDB().ideas].sort((a, b) => b.votes - a.votes);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">💡 아이디어 보드</h1>
        <p className="mt-1 text-sm text-slate-500">
          제안을 올리고 투표·논의하며 방향을 잡아갑니다. 표가 많은 순으로 정렬됩니다.
        </p>
      </div>

      <div className="space-y-3">
        {ideas.map((it) => (
          <div key={it.id} className="card flex gap-4 p-4">
            <form action={voteIdea}>
              <input type="hidden" name="id" value={it.id} />
              <button className="flex h-14 w-12 flex-col items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-amber hover:text-amber">
                <span className="text-xs">▲</span>
                <span className="text-base font-bold">{it.votes}</span>
              </button>
            </form>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${STATUS_STYLE[it.status]}`}>{it.status}</span>
                {it.tags.map((t) => (
                  <span key={t} className="chip">#{t}</span>
                ))}
              </div>
              <Link href={`/ideas/${it.id}`} className="mt-1.5 block font-bold hover:underline">
                {it.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{it.body}</p>
              <div className="mt-2 text-xs text-slate-400">
                {it.author} · {it.at} · 💬 {it.comments.length}
              </div>
            </div>
          </div>
        ))}
      </div>

      <details className="card p-5">
        <summary className="cursor-pointer text-sm font-semibold text-ink">＋ 새 아이디어 제안하기</summary>
        <form action={addIdea} className="mt-4 space-y-3">
          <input name="title" className="input" placeholder="제목" required />
          <textarea name="body" className="input min-h-24" placeholder="설명" />
          <input name="tags" className="input" placeholder="태그 (쉼표로 구분: UX, 누진제)" />
          <button className="btn-primary">등록</button>
        </form>
      </details>
    </div>
  );
}
