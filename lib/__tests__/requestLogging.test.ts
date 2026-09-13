import { currentRequestId } from "../logging";
import { requestLogging } from "../requestLogging";

function captureStdout(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const original = process.stdout.write;
  // @ts-ignore
  process.stdout.write = (chunk: string) => {
    lines.push(String(chunk));
    return true;
  };
  return { lines, restore: () => (process.stdout.write = original) };
}

function fakeReq(overrides: Record<string, unknown> = {}) {
  return { method: "GET", url: "/api/datasets?q=x", headers: {}, ...overrides } as any;
}

function fakeRes(statusCode = 200) {
  return { statusCode, setHeader: jest.fn() } as any;
}

describe("the BFF request middleware", () => {
  it("makes a request id available to everything downstream", async () => {
    let seen: string | undefined;

    await requestLogging(fakeReq(), fakeRes(), async () => {
      seen = currentRequestId();
    });

    expect(seen).toBeDefined();
  });

  it("keeps an id the caller already assigned", async () => {
    let seen: string | undefined;

    await requestLogging(
      fakeReq({ headers: { "x-request-id": "req-from-caller" } }),
      fakeRes(),
      async () => {
        seen = currentRequestId();
      }
    );

    expect(seen).toBe("req-from-caller");
  });

  it("returns the id on the response so the browser can quote it", async () => {
    const res = fakeRes();

    await requestLogging(fakeReq(), res, async () => undefined);

    expect(res.setHeader).toHaveBeenCalledWith("X-Request-Id", expect.any(String));
  });

  it("writes one access line with the status and the path", async () => {
    const captured = captureStdout();
    try {
      await requestLogging(fakeReq(), fakeRes(201), async () => undefined);
    } finally {
      captured.restore();
    }

    const entry = JSON.parse(captured.lines[0]);
    expect(entry.logger).toBe("bff.access");
    expect(entry.status_code).toBe(201);
    expect(entry.path).toBe("/api/datasets");
    expect(entry.request_id).toBeDefined();
  });

  it("does not put the query string in the log", async () => {
    const captured = captureStdout();
    try {
      await requestLogging(
        fakeReq({ url: "/api/datasets?token=should-not-be-logged" }),
        fakeRes(),
        async () => undefined
      );
    } finally {
      captured.restore();
    }

    expect(captured.lines.join("")).not.toContain("should-not-be-logged");
  });

  it("still logs when the handler throws, and lets the error through", async () => {
    const captured = captureStdout();
    let raised: unknown;
    try {
      await requestLogging(fakeReq(), fakeRes(500), async () => {
        throw new Error("boom");
      });
    } catch (error) {
      raised = error;
    } finally {
      captured.restore();
    }

    expect((raised as Error).message).toBe("boom");
    expect(captured.lines.some((line) => line.includes("bff.access"))).toBe(true);
  });
});
