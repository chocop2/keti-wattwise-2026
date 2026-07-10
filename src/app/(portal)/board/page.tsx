import { getDB } from "@/lib/store";
import { addPost } from "@/lib/actions";

export default function BoardPage() {
  const { posts } = getDB();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">📝 게시판</h1>
        <p className="mt-1 text-sm text-slate-500">공지, 자료 정리, 자유로운 글을 남기는 공간입니다.</p>
      </div>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="flex items-center gap-2">
              {p.pinned && <span className="badge bg-danger-soft text-danger">📌 공지</span>}
              <span className="font-bold">{p.title}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{p.body}</p>
            <div className="mt-2 text-xs text-slate-400">{p.author} · {p.at} · 💬 {p.comments}</div>
          </div>
        ))}
      </div>

      <details className="card p-5">
        <summary className="cursor-pointer text-sm font-semibold">＋ 글쓰기</summary>
        <form action={addPost} className="mt-4 space-y-3">
          <input name="title" className="input" placeholder="제목" required />
          <textarea name="body" className="input min-h-24" placeholder="내용 (마크다운 지원 예정)" />
          <button className="btn-primary">등록</button>
        </form>
      </details>
    </div>
  );
}
