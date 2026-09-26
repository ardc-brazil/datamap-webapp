import { getMetrics, routeOf } from "../metrics";

async function value(name: string, labels: Record<string, string> = {}): Promise<number> {
  const metric = getMetrics().registry.getSingleMetric(name);
  if (!metric) return 0;
  const { values } = await metric.get();
  const match = values.find((sample) =>
    Object.entries(labels).every(([key, wanted]) => String(sample.labels[key]) === wanted)
  );
  return match?.value ?? 0;
}

async function count(name: string, labels: Record<string, string>): Promise<number> {
  const metric = getMetrics().registry.getSingleMetric(name);
  if (!metric) return 0;
  const { values } = await metric.get();
  const match = values.find(
    (sample) =>
      (sample as { metricName?: string }).metricName === `${name}_count` &&
      Object.entries(labels).every(([key, wanted]) => String(sample.labels[key]) === wanted)
  );
  return match?.value ?? 0;
}

describe("the route a BFF request is recorded under", () => {
  it("is the page template, with the dynamic segment named", () => {
    expect(routeOf("/api/datasets/7a9b5d5e?x=1", { datasetId: "7a9b5d5e", x: "1" })).toBe(
      "/api/datasets/[datasetId]"
    );
  });

  it("names every dynamic segment", () => {
    expect(
      routeOf("/api/datasets/abc/versions/2", { datasetId: "abc", versionName: "2" })
    ).toBe("/api/datasets/[datasetId]/versions/[versionName]");
  });

  it("names a catch-all route once, however many segments it swallowed", () => {
    expect(routeOf("/api/auth/callback/github", { nextauth: ["callback", "github"] })).toBe(
      "/api/auth/[...nextauth]"
    );
  });

  it("leaves query parameters alone, since they are not in the path", () => {
    expect(routeOf("/api/datasets?page=2", { page: "2" })).toBe("/api/datasets");
  });
});

describe("the metrics the webapp serves", () => {
  it("are one registry for the whole process, however many bundles import them", () => {
    expect(getMetrics()).toBe(getMetrics());
  });

  it("count a request by route and status", async () => {
    const labels = { method: "GET", route: "/api/test-route", status: "200", client: "none" };
    const before = await value("datamap_http_requests_total", labels);

    getMetrics().recordRequest("GET", "/api/test-route", 200, 0.05, 10, 20);

    expect(await value("datamap_http_requests_total", labels)).toBe(before + 1);
  });

  it("time a call to the gatekeeper through the hook rpc.ts uses", async () => {
    getMetrics();
    const labels = { service: "gatekeeper", operation: "GET /datasets/{id}", outcome: "timeout" };
    const before = await count("datamap_external_request_duration_seconds", labels);

    (globalThis as any).__datamapRecordExternalCall("gatekeeper", "GET /datasets/{id}", "timeout", 10);

    expect(await count("datamap_external_request_duration_seconds", labels)).toBe(before + 1);
  });

  it("count logins by provider", async () => {
    const labels = { provider: "github", outcome: "success" };
    const before = await value("datamap_webapp_logins_total", labels);

    getMetrics().recordLogin("github", "success");

    expect(await value("datamap_webapp_logins_total", labels)).toBe(before + 1);
  });

  it("render in the prometheus text format, with the node runtime's own", async () => {
    const text = await getMetrics().registry.metrics();

    expect(text).toContain("datamap_http_requests_total");
    expect(text).toContain("nodejs_eventloop_lag_seconds");
  });
});

describe("what the browser reports", () => {
  it("records a vital under its page template", async () => {
    const labels = { metric: "LCP", page: "/app/datasets/[datasetId]" };
    const before = await count("datamap_web_vitals_seconds", labels);

    const accepted = getMetrics().recordTelemetry([
      { type: "vital", name: "LCP", value: 1800, page: "/app/datasets/[datasetId]" },
    ]);

    expect(accepted).toBe(1);
    expect(await count("datamap_web_vitals_seconds", labels)).toBe(before + 1);
  });

  it("records the layout shift score apart, since it is not a time", async () => {
    const before = await count("datamap_web_vitals_cls", { page: "/" });

    getMetrics().recordTelemetry([{ type: "vital", name: "CLS", value: 0.12, page: "/" }]);

    expect(await count("datamap_web_vitals_cls", { page: "/" })).toBe(before + 1);
  });

  it("counts page views, errors and ui events", async () => {
    const view = await value("datamap_web_page_views_total", { page: "/app/home" });
    const error = await value("datamap_web_errors_total", { page: "/app/home" });
    const event = await value("datamap_web_ui_events_total", { event: "search", page: "/app/datasets" });

    const accepted = getMetrics().recordTelemetry([
      { type: "pageview", page: "/app/home" },
      { type: "error", page: "/app/home", message: "x is undefined" },
      { type: "ui", event: "search", page: "/app/datasets" },
    ]);

    expect(accepted).toBe(3);
    expect(await value("datamap_web_page_views_total", { page: "/app/home" })).toBe(view + 1);
    expect(await value("datamap_web_errors_total", { page: "/app/home" })).toBe(error + 1);
    expect(await value("datamap_web_ui_events_total", { event: "search", page: "/app/datasets" })).toBe(
      event + 1
    );
  });

  it("drops what is not on the lists, and nonsense values", () => {
    const accepted = getMetrics().recordTelemetry([
      { type: "ui", event: "invented", page: "/" },
      { type: "vital", name: "BOGUS", value: 1, page: "/" },
      { type: "vital", name: "LCP", value: -5, page: "/" },
      { type: "vital", name: "LCP", value: Number.NaN, page: "/" },
      { type: "mystery" } as any,
    ]);

    expect(accepted).toBe(0);
  });

  it("files an unknown page as other instead of making a series of it", async () => {
    const before = await value("datamap_web_page_views_total", { page: "other" });

    getMetrics().recordTelemetry([{ type: "pageview", page: "/app/datasets/7a9b5d5e" }]);

    expect(await value("datamap_web_page_views_total", { page: "other" })).toBe(before + 1);
  });
});
