import { get } from "http";
import { AddressInfo } from "net";

import { getMetrics } from "../metrics";
import { startMetricsServer } from "../metricsServer";

function fetchText(port: number, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    get({ host: "127.0.0.1", port, path }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    }).on("error", reject);
  });
}

describe("the metrics port", () => {
  afterEach(() => {
    (globalThis as any).__datamapMetricsServer?.close();
    delete (globalThis as any).__datamapMetricsServer;
  });

  it("serves the shared registry in the prometheus format", async () => {
    getMetrics().recordRequest("GET", "/api/served-route", 200, 0.01);
    const server = await startMetricsServer(0, "127.0.0.1");
    const { port } = server!.address() as AddressInfo;

    const { status, body } = await fetchText(port, "/metrics");

    expect(status).toBe(200);
    expect(body).toContain('route="/api/served-route"');
  });

  it("answers nothing but /metrics", async () => {
    const server = await startMetricsServer(0, "127.0.0.1");
    const { port } = server!.address() as AddressInfo;

    expect((await fetchText(port, "/")).status).toBe(404);
  });

  it("is started once per process, however many times it is asked", async () => {
    const first = await startMetricsServer(0, "127.0.0.1");
    const second = await startMetricsServer(0, "127.0.0.1");

    expect(second).toBe(first);
  });
});
