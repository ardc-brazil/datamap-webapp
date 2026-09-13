import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

/**
 * The BFF's axios instance carries X-Api-Key and X-Api-Secret on every request,
 * so `console.log(error)` prints them: an axios error holds `config.headers`.
 * Proven in logging.test.ts against a real axios error.
 *
 * Server-side code therefore goes through `logError`, which decides what may be
 * said about a failure. This is the check that keeps it that way, because the
 * next `console.log(error)` will look perfectly reasonable in review.
 */

const SERVER_SIDE = ["lib", join("pages", "api")];

// A page's getServerSideProps runs on the server and reaches the same
// credentialed axios instance. Two of them were logging axios errors, and the
// first version of this check looked only at `lib` and `pages/api`.
const SERVER_RENDERED = /export\s+(async\s+)?function\s+(getServerSideProps|getStaticProps)|export\s+const\s+(getServerSideProps|getStaticProps)/;

function sourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === "__tests__" ? [] : sourceFiles(full);
    }
    return /\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [full] : [];
  });
}

function consoleCallsIn(file: string): string[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, index) => {
      const code = line.trim();
      if (code.startsWith("//") || code.startsWith("*")) {
        return [];
      }
      return /\bconsole\.(log|error|warn|info|debug)\s*\(/.test(code)
        ? [`${file.replace(process.cwd() + "/", "")}:${index + 1}`]
        : [];
    });
}

describe("server-side code", () => {
  it("never calls console directly", () => {
    const offenders: string[] = [];

    for (const dir of SERVER_SIDE) {
      for (const file of sourceFiles(join(process.cwd(), dir))) {
        offenders.push(...consoleCallsIn(file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it("includes pages that render on the server", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(join(process.cwd(), "pages"))) {
      if (SERVER_RENDERED.test(readFileSync(file, "utf8"))) {
        offenders.push(...consoleCallsIn(file));
      }
    }

    expect(offenders).toEqual([]);
  });
});
