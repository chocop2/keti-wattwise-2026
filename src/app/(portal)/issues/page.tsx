import { getDB, type Lane } from "@/lib/store";
import { moveIssue, addIssue } from "@/lib/actions";

const LANES: { key: Lane; label: string; tone: string }[] = [
  { key: "todo", label: "할 일", tone: "text-slate-500" },
  { key: "doing", label: "진행중", tone: "text-amber" },
  { key: "done", label: "완료", tone: "text-ok" },
];

export default function IssuesPage() {
  const { issues } = getDB();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">📋 이슈 / 할일</h1>
        <p className="mt-1 text-sm text-slate-500">칸반으로 작업을 추적합니다. 카드의 화살표로 상태를 옮기세요.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {LANES.map((lane) => {
          const items = issues.filter((i) => i.lane === lane.key);
          return (
            <div key={lane.key} className="rounded-2xl bg-slate-100/70 p-3">
              <div className={`mb-3 flex items-center justify-between px-1 text-sm font-bold ${lane.tone}`}>
                <span>{lane.label}</span>
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="card p-3">
                    <div className="text-sm font-medium">{it.title}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {it.tag && <span className="chip">#{it.tag}</span>}
                        {it.assignee && <span className="text-xs text-slate-400">{it.assignee}</span>}
                      </div>
                      <div className="flex gap-1">
                        <form>
                          <input type="hidden" name="id" value={it.id} />
                          <input type="hidden" name="dir" value="prev" />
                          <button className="rounded border border-slate-200 px-1.5 text-xs text-slate-400 hover:bg-slate-50" disabled={lane.key === "todo"}>◀</button>
                        </form>
                        <form>
                          <input type="hidden" name="id" value={it.id} />
                          <input type="hidden" name="dir" value="next" />
                          <button className="rounded border border-slate-200 px-1.5 text-xs text-slate-400 hover:bg-slate-50" disabled={lane.key === "done"}>▶</button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="px-1 py-6 text-center text-xs text-slate-400">비어 있음</div>}
              </div>
            </div>
          );
        })}
      </div>

      <details className="card p-5">
        <summary className="cursor-pointer text-sm font-semibold">＋ 새 이슈 추가</summary>
        <form className="mt-4 flex flex-wrap gap-2">
          <input name="title" className="input flex-1" placeholder="할 일 제목" required />
          <input name="assignee" className="input w-32" placeholder="담당자" />
          <input name="tag" className="input w-28" placeholder="태그" />
          <button className="btn-primary">추가</button>
        </form>
      </details>
    </div>
  );
}
