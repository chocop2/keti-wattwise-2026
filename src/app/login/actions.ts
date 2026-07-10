"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, verify } from "@/lib/auth";

export async function login(_prev: unknown, formData: FormData) {
  const id = String(formData.get("username") || "").trim();
  const pw = String(formData.get("password") || "");
  const user = verify(id, pw);
  if (!user) return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  cookies().set(COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export async function logout() {
  cookies().delete(COOKIE);
  redirect("/login");
}
