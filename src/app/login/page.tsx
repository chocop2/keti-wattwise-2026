"use client";

import { useFormState } from "react-dom";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action] = useFormState(login, { error: "" } as { error: string });
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-black text-white">
            W
          </div>
          <div className="text-lg font-extrabold tracking-tight">WattWise Pi</div>
        </div>
        <div className="card p-6">
          <h1 className="text-lg font-bold">프로젝트 포털 로그인</h1>
          <p className="mt-1 text-xs text-slate-500">
            엣지 AI 전력 예측 · 이상감지 · 절전 비서
          </p>
          <form action={action} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="username">아이디</label>
              <input id="username" name="username" className="input" placeholder="korea_03" autoFocus required />
            </div>
            <div>
              <label className="label" htmlFor="password">비밀번호</label>
              <input id="password" name="password" type="password" className="input" placeholder="••••" required />
            </div>
            {state?.error ? (
              <p className="text-xs font-medium text-danger">{state.error}</p>
            ) : null}
            <button type="submit" className="btn-primary w-full">로그인</button>
            <p className="text-center text-xs text-slate-400">
              팀 계정 · korea_01 / korea_02 / korea_03 · 비밀번호 korea
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
