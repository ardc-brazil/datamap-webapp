import axios from "axios";
import {
  currentRequestId,
  describeError,
  logAccess,
  logError,
  redact,
  withRequestId,
} from "../logging";

function captureStdout(run: () => void): string[] {
  const lines: string[] = [];
  const original = process.stdout.write;
  // @ts-ignore
  process.stdout.write = (chunk: string) => {
    lines.push(String(chunk));
    return true;
  };
  try {
    run();
  } finally {
    process.stdout.write = original;
  }
  return lines.filter((line) => line.trim().length > 0);
}

describe("a log line", () => {
  it("is JSON with the same field names the other services use", () => {
    const lines = captureStdout(() =>
      logAccess({ method: "GET", path: "/api/datasets", statusCode: 200, durationMs: 12.5 })
    );

    const entry = JSON.parse(lines[0]);
    expect(entry.message).toBe("request");
    expect(entry.level).toBe("INFO");
    expect(entry.logger).toBe("bff.access");
    expect(entry.status_code).toBe(200);
    expect(entry.timestamp).toBeDefined();
  });

  it("carries the request id when one is in scope", () => {
    const lines = withRequestId("req-abc", () =>
      captureStdout(() => logAccess({ method: "GET", path: "/x", statusCode: 200, durationMs: 1 }))
    );

    expect(JSON.parse(lines[0]).request_id).toBe("req-abc");
  });

  it("omits the request id rather than inventing one outside a request", () => {
    const lines = captureStdout(() =>
      logAccess({ method: "GET", path: "/x", statusCode: 200, durationMs: 1 })
    );

    expect(JSON.parse(lines[0]).request_id).toBeUndefined();
  });
});

describe("an axios failure", () => {
  /**
   * `console.log(error)` prints error.config.headers, and the BFF's axios
   * instance carries X-Api-Key and X-Api-Secret on every request. Proven: the
   * three secrets below all appear in util.inspect of a real axios error.
   */
  async function anAxiosError() {
    const instance = axios.create({
      baseURL: "http://127.0.0.1:1/",
      timeout: 300,
      headers: { "X-Api-Key": "KEY-c0ffee", "X-Api-Secret": "SECRET-hunter2" },
    });
    try {
      await instance.get("/datasets", {
        headers: { "X-User-Token": "TOKEN-eyJhbGciOi" },
      });
      throw new Error("the request was supposed to fail");
    } catch (error) {
      return error;
    }
  }

  it("never reaches the log with its credentials", async () => {
    const error = await anAxiosError();

    const described = JSON.stringify(describeError(error));

    expect(described).not.toContain("SECRET-hunter2");
    expect(described).not.toContain("KEY-c0ffee");
    expect(described).not.toContain("TOKEN-eyJhbGciOi");
  });

  it("still says what failed and where", async () => {
    const error = await anAxiosError();

    const described = describeError(error) as Record<string, unknown>;

    expect(described.url).toContain("/datasets");
    expect(described.message).toBeDefined();
  });

  it("reports the status when the server answered", () => {
    const error = {
      isAxiosError: true,
      message: "Request failed with status code 404",
      response: { status: 404 },
      config: { url: "/datasets/x", method: "get", headers: { "X-Api-Secret": "s" } },
    };

    const described = describeError(error) as Record<string, unknown>;

    expect(described.status).toBe(404);
    expect(JSON.stringify(described)).not.toContain('"s"');
  });

  it("logs as an error line with the fields worth querying", async () => {
    const error = await anAxiosError();

    const lines = captureStdout(() => logError("dataset fetch failed", error, { dataset_id: "d-1" }));

    const entry = JSON.parse(lines[0]);
    expect(entry.level).toBe("ERROR");
    expect(entry.dataset_id).toBe("d-1");
    expect(JSON.stringify(entry)).not.toContain("SECRET-hunter2");
  });
});

describe("something that is not an Error", () => {
  it("is described by its own fields, not as [object Object]", () => {
    const described = describeError({ status: 500, code: "GATEKEEPER_DOWN" });

    expect(described.status).toBe(500);
    expect(described.code).toBe("GATEKEEPER_DOWN");
  });

  it("is still stripped of anything credential-shaped", () => {
    const described = describeError({
      status: 500,
      config: { headers: { "X-Api-Secret": "leaked" } },
    });

    expect(JSON.stringify(described)).not.toContain("leaked");
  });

  it("falls back to a string for a primitive", () => {
    expect(describeError("boom").message).toBe("boom");
  });
});

describe("redaction", () => {
  it("masks anything whose key names a credential", () => {
    const scrubbed = redact({
      "X-Api-Secret": "s",
      Authorization: "Bearer x",
      password: "p",
      dataset_id: "keep-me",
    }) as Record<string, unknown>;

    expect(scrubbed["X-Api-Secret"]).toBe("[redacted]");
    expect(scrubbed.Authorization).toBe("[redacted]");
    expect(scrubbed.password).toBe("[redacted]");
    expect(scrubbed.dataset_id).toBe("keep-me");
  });

  it("reaches nested values", () => {
    const scrubbed = redact({ config: { headers: { "X-User-Token": "leaked" } } });

    expect(JSON.stringify(scrubbed)).not.toContain("leaked");
  });

  it("survives a circular object rather than throwing", () => {
    const circular: Record<string, unknown> = { name: "a" };
    circular.self = circular;

    expect(() => redact(circular)).not.toThrow();
  });
});

describe("the request id", () => {
  it("is visible to anything running inside the request", () => {
    const seen = withRequestId("req-1", () => currentRequestId());

    expect(seen).toBe("req-1");
  });

  it("does not leak out of the request that set it", () => {
    withRequestId("req-1", () => undefined);

    expect(currentRequestId()).toBeUndefined();
  });
});
