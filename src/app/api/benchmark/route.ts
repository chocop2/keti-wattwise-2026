import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type BenchmarkHouse = { start: string; split: string; type: string; area: string; nch: number; daily_avg: number; y: number[] };

export async function GET() {
  try {
    const html = await readFile(path.join(process.cwd(), "public", "dash", "benchmark.html"), "utf8");
    const match = html.match(/const DATA=(.*?);\s*\n/);
    if (!match) throw new Error("benchmark data not found");
    const data = JSON.parse(match[1]) as Record<string, BenchmarkHouse>;
    const houses = Object.entries(data).map(([id, house]) => ({
      id,
      label: id.replace("house_", "가구 "),
      start: house.start,
      split: house.split,
      type: house.type,
      area: house.area,
      channels: house.nch,
      dailyAverage: house.daily_avg,
      values: house.y,
    }));
    return NextResponse.json({ houses });
  } catch {
    return NextResponse.json({ error: "실측 벤치마크 데이터를 불러오지 못했습니다." }, { status: 500 });
  }
}
