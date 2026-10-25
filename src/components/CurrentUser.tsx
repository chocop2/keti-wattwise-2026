"use client";

import { createContext, useContext } from "react";

// 서버 레이아웃에서 확인한 로그인 사용자를 클라이언트 페이지에서도 쓰도록 넘겨준다.
type CurrentUser = { id: string; name: string; role: string };

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}

// "박채연 (korea_01)"처럼 계정 아이디가 붙은 이름에서 사람 이름만 꺼낸다.
export function displayName(name: string) {
  return name.replace(/\s*\(.*\)\s*$/, "");
}
