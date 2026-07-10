import { cookies } from "next/headers";

export const COOKIE = "ww_session";

export type Account = { id: string; name: string; role: "팀원" | "멘토" };

export const ACCOUNTS: Record<string, { pw: string } & Account> = {
  korea_01: { id: "korea_01", name: "팀원 korea_01", role: "팀원", pw: "korea" },
  korea_02: { id: "korea_02", name: "팀원 korea_02", role: "팀원", pw: "korea" },
  korea_03: { id: "korea_03", name: "최진규 (korea_03)", role: "팀원", pw: "korea" },
};

export function verify(id: string, pw: string): Account | null {
  const a = ACCOUNTS[id];
  if (a && a.pw === pw) return { id: a.id, name: a.name, role: a.role };
  return null;
}

export function currentUser(): Account | null {
  const id = cookies().get(COOKIE)?.value;
  if (!id) return null;
  const a = ACCOUNTS[id];
  return a ? { id: a.id, name: a.name, role: a.role } : null;
}
