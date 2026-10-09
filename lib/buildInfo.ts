import { execSync } from "child_process";

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function shortCommit(
    env: Record<string, string | undefined> = process.env,
    git: () => string = () => execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString()
): string {
    if (env.BUILD_COMMIT) {
        return env.BUILD_COMMIT.slice(0, 7);
    }
    try {
        return git().trim() || "sem-commit";
    } catch {
        return "sem-commit";
    }
}

export function formatLongDate(date: Date): string {
    return `${date.getUTCDate()} de ${MONTHS[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}
