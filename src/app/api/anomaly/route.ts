import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { pythonExecutable } from "@/lib/pythonRuntime";
const execFileAsync = promisify(execFile);
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { scenario?: string };
    if (!body.scenario || !["normal", "always_on", "cooking_loss", "inactive", "night_loss", "away"].includes(body.scenario)) return NextResponse.json({ error: "지원하지 않는 시나리오입니다." }, { status: 400 });
    const root = process.cwd(); const python = await pythonExecutable(root);
    const { stdout } = await execFileAsync(python, ["anomaly_inference.py", "--scenario", body.scenario], { cwd: path.join(root, "household_chronos2"), timeout: 60_000 });
    return NextResponse.json(JSON.parse(stdout.trim()));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "모델 추론에 실패했습니다." }, { status: 500 }); }
}
