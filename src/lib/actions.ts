"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getDB, saveDB, nextId, type Status, type Lane } from "@/lib/store";

function me() {
  return currentUser()?.name ?? "익명";
}
const today = () => "2026-07-10";

export async function voteIdea(formData: FormData) {
  const id = Number(formData.get("id"));
  const db = getDB();
  const it = db.ideas.find((x) => x.id === id);
  if (it) {
    it.votes += 1;
    saveDB(db);
  }
  revalidatePath("/ideas");
  revalidatePath(`/ideas/${id}`);
}

export async function addComment(formData: FormData) {
  const id = Number(formData.get("id"));
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  const db = getDB();
  const it = db.ideas.find((x) => x.id === id);
  if (it) {
    it.comments.push({ id: nextId(), author: me(), body, at: today() });
    saveDB(db);
  }
  revalidatePath(`/ideas/${id}`);
}

export async function setIdeaStatus(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as Status;
  const db = getDB();
  const it = db.ideas.find((x) => x.id === id);
  if (it) {
    it.status = status;
    saveDB(db);
  }
  revalidatePath(`/ideas/${id}`);
  revalidatePath("/ideas");
}

export async function addIdea(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!title) return;
  const db = getDB();
  const id = nextId();
  db.ideas.push({ id, title, body, author: me(), at: today(), votes: 0, status: "열림", tags, comments: [] });
  saveDB(db);
  revalidatePath("/ideas");
  redirect(`/ideas/${id}`);
}

export async function addDecision(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const db = getDB();
  db.decisions.unshift({
    id: nextId(),
    date: today().replaceAll("-", "."),
    title,
    background: String(formData.get("background") || ""),
    decision: String(formData.get("decision") || ""),
    attendees: String(formData.get("attendees") || ""),
    recorder: me(),
  });
  saveDB(db);
  revalidatePath("/decisions");
}

export async function moveIssue(formData: FormData) {
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir"));
  const order: Lane[] = ["todo", "doing", "done"];
  const db = getDB();
  const it = db.issues.find((x) => x.id === id);
  if (it) {
    const i = order.indexOf(it.lane);
    const ni = Math.max(0, Math.min(order.length - 1, i + (dir === "next" ? 1 : -1)));
    it.lane = order[ni];
    saveDB(db);
  }
  revalidatePath("/issues");
}

export async function addIssue(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const db = getDB();
  db.issues.push({
    id: nextId(),
    title,
    lane: "todo",
    assignee: String(formData.get("assignee") || "") || undefined,
    tag: String(formData.get("tag") || "") || undefined,
  });
  saveDB(db);
  revalidatePath("/issues");
}

export async function addPost(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const db = getDB();
  db.posts.unshift({
    id: nextId(),
    title,
    body: String(formData.get("body") || ""),
    author: me(),
    at: today(),
    comments: 0,
  });
  saveDB(db);
  revalidatePath("/board");
}

export async function addFile(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const db = getDB();
  db.files.unshift({
    id: nextId(),
    name,
    desc: String(formData.get("desc") || ""),
    by: me(),
    at: today(),
    size: "—",
  });
  saveDB(db);
  revalidatePath("/files");
}
