import { access } from "node:fs/promises";
import path from "node:path";

export async function pythonExecutable(root: string) {
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
