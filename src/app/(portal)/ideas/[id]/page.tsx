import Link from "next/link";
import { notFound } from "next/navigation";
import { getDB } from "@/lib/store";
import { voteIdea, addComment, setIdeaStatus } from "@/lib/actions";

const STATUSES = ["열림", "검토중", "채택", "보류"] as const;

export default function IdeaDetail({ params }: { params: { id: string } }) {
  const it = getDB().ideas.find((x) => x.id === Number(params.id));
  if (!it) notFound();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/ideas" className="text-sm text-slate-500 hover:underline">← 아이디어 보드</Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-amber-soft text-amber">{it.status}</span>
          {it.tags.map((t) => (
            <span key={t} className="chip">#{t}</span>
          ))}
        </div>
        <h1 className="mt-2 text-2xl font-extrabold">{it.title}</h1>
        <div className="mt-1 text-xs text-slate-400">{it.author} · {it.at}</div>
        <p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-700">{it.body}</p>

        <div className="mt-5 flex items-center gap-3">
          <form action={voteIdea}>
            <input type="hidden" name="id" value={it.id} />
            <button className="btn-ghost">▲ 추천 {it.votes}</button>
          </form>
          <form action={setIdeaStatus} className="flex items-center gap-2">
            <input type="hidden" name="id" value={it.id} />
            <span className="text-xs text-slate-400">상태:</span>
            {STATUSES.map((s) => (
              <button key={s} name="status" value={s} className={`chip hover:bg-slate-200 ${it.status === s ? "!bg-ink !text-white" : ""}`}>
                {s}
              </button>
            ))}
          </form>
        </div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-bold">💬 댓글 {it.comments.length}</div>
        <div className="mt-4 space-y-3">
          {it.comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">{c.author} · {c.at}</div>
              <div className="mt-1 text-sm text-slate-700">{c.body}</div>
            </div>
          ))}
          {it.comments.length === 0 && <p className="text-sm text-slate-400">첫 댓글을 남겨보세요.</p>}
        </div>
        <form action={addComment} className="mt-4 flex gap-2">
          <input type="hidden" name="id" value={it.id} />
          <input name="body" className="input" placeholder="댓글 작성" required />
          <button className="btn-primary shrink-0">등록</button>
        </form>
      </div>
    </div>
  );
}
