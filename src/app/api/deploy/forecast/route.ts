import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const APPLIANCES = ["tv", "에어컨", "제습기", "세탁기"] as const;

async function pythonExecutable(root: string) {
  const candidates = [
    process.env.WATTWISE_PYTHON,
    path.join(root, ".venv-dashboard", "bin", "python"),
    path.join(root, "keti", "bin", "python"),
    "python3",
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (candidate === "python3") return candidate;
    try {
      await access(candidate);
      return candidate;
    } catch {
      // 다음 후보를 확인한다.
    }
  }
  return "python3";
}

export async function GET() {
  const root = process.cwd();
  const appliances = await Promise.all(
    APPLIANCES.map(async (id) => {
      const summaryPath = path.join(root, "dashboard", "data", id, "preprocessing_summary.json");
      const summary = JSON.parse(await readFile(summaryPath, "utf8"));
      return {
        id,
        label: id === "tv" ? "TV" : id,
        seriesIds: summary.series_ids as string[],
        rows: summary.valid_target_rows as number,
        periodStart: summary.period_start as string,
        periodEnd: summary.period_end as string,
      };
    }),
  );
  return NextResponse.json({ appliances });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { appliance?: string; seriesId?: string };
    if (!APPLIANCES.includes(body.appliance as (typeof APPLIANCES)[number])) {
      return NextResponse.json({ error: "지원하지 않는 가전입니다." }, { status: 400 });
    }

    const root = process.cwd();
    const summaryPath = path.join(root, "dashboard", "data", body.appliance!, "preprocessing_summary.json");
    const summary = JSON.parse(await readFile(summaryPath, "utf8"));
    if (!body.seriesId || !(summary.series_ids as string[]).includes(body.seriesId)) {
      return NextResponse.json({ error: "선택한 가전에 존재하지 않는 실측 시계열입니다." }, { status: 400 });
    }

    const python = await pythonExecutable(root);
    const script = path.join(root, "dashboard", "web_inference.py");
    const { stdout } = await execFileAsync(
      python,
      [script, "--appliance", body.appliance!, "--series-id", body.seriesId, "--device", "cpu"],
      { cwd: path.join(root, "dashboard"), timeout: 10 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 },
    );
    return NextResponse.json(JSON.parse(stdout.trim()));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const dependencyMissing = /No module named|ModuleNotFoundError|chronos/i.test(detail);
    return NextResponse.json(
      {
        error: dependencyMissing
          ? "예측용 Python 환경이 준비되지 않았습니다. dashboard/requirements.txt를 설치해 주세요."
          : "로컬 모델 예측 중 오류가 발생했습니다.",
        detail,
      },
      { status: 500 },
    );
  }
}
