jest.mock("next-auth/jwt", () => ({ getToken: jest.fn(async () => ({ uid: "user-123" })) }));

import handler from "../../pages/api/telemetry";

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

function fakeRes() {
  const res: any = { statusCode: 200, headers: {} };
  res.setHeader = jest.fn((key: string, value: string) => (res.headers[key] = value));
  res.getHeader = jest.fn((key: string) => res.headers[key]);
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.end = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

async function send(method: string, body: unknown) {
  const res = fakeRes();
  const captured = captureStdout();
  try {
    await handler({ method, url: "/api/telemetry", headers: {}, query: {}, body } as any, res);
  } finally {
    captured.restore();
  }
  return { res, lines: captured.lines.map((line) => JSON.parse(line)) };
}

describe("the browser telemetry endpoint", () => {
  it("accepts a batch and answers with no content", async () => {
    const { res } = await send("POST", {
      events: [{ type: "pageview", page: "/app/home" }],
    });

    expect(res.statusCode).toBe(204);
  });

  it("writes what it accepted as one line, with the user, for the logs", async () => {
    const { lines } = await send("POST", {
      events: [
        { type: "ui", event: "download_clicked", page: "/app/datasets/[datasetId]" },
        { type: "ui", event: "invented", page: "/" },
      ],
    });

    const entry = lines.find((line) => line.logger === "web.telemetry");
    expect(entry.user_id).toBe("user-123");
    expect(entry.accepted).toBe(1);
    expect(entry.events).toEqual([
      { type: "ui", event: "download_clicked", page: "/app/datasets/[datasetId]" },
    ]);
  });

  it("keeps only the start of a browser error message", async () => {
    const { lines } = await send("POST", {
      events: [{ type: "error", page: "/", message: "x".repeat(2000) }],
    });

    const entry = lines.find((line) => line.logger === "web.telemetry");
    expect(entry.events[0].message.length).toBeLessThanOrEqual(300);
  });

  it("refuses a body that is not a batch", async () => {
    const { res } = await send("POST", { events: "nope" });

    expect(res.statusCode).toBe(400);
  });

  it("answers only POST", async () => {
    const { res } = await send("GET", undefined);

    expect(res.statusCode).toBe(405);
  });
});
