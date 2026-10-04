// Server-side only. The metric names and labels are the platform's contract:
// gatekeeper docs/rfcs/005-platform-metrics-and-dashboards.md.

import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from "prom-client";

import {
  TELEMETRY_MAX_EVENTS_PER_BATCH,
  TIMED_VITALS,
  pageLabel,
  uiEventLabel,
} from "../contants/TelemetryConstants";
import type { CallOutcome } from "./externalCalls";

const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30];
const SIZE_BUCKETS = Array.from({ length: 10 }, (_, power) => 256 * 4 ** power);
const VITAL_BUCKETS = [0.1, 0.25, 0.5, 0.8, 1, 1.8, 2.5, 3, 4, 6, 10, 20];
const CLS_BUCKETS = [0.01, 0.05, 0.1, 0.15, 0.25, 0.5, 1];
const MAX_VITAL_SECONDS = 600;

export type TelemetryEvent =
  | { type: "vital"; name: string; value: number; page?: string }
  | { type: "pageview"; page?: string }
  | { type: "error"; page?: string; message?: string }
  | { type: "ui"; event: string; page?: string };

class Metrics {
  readonly registry = new Registry();

  private readonly requests = new Counter({
    name: "datamap_http_requests_total",
    help: "HTTP requests served",
    labelNames: ["method", "route", "status", "client"],
    registers: [this.registry],
  });
  private readonly duration = new Histogram({
    name: "datamap_http_request_duration_seconds",
    help: "Time spent serving a request",
    labelNames: ["method", "route"],
    buckets: DURATION_BUCKETS,
    registers: [this.registry],
  });
  private readonly requestSize = new Histogram({
    name: "datamap_http_request_size_bytes",
    help: "Size of request bodies, when declared",
    labelNames: ["method", "route"],
    buckets: SIZE_BUCKETS,
    registers: [this.registry],
  });
  private readonly responseSize = new Histogram({
    name: "datamap_http_response_size_bytes",
    help: "Size of response bodies, when declared",
    labelNames: ["method", "route"],
    buckets: SIZE_BUCKETS,
    registers: [this.registry],
  });
  readonly inProgress = new Gauge({
    name: "datamap_http_requests_in_progress",
    help: "Requests being served right now",
    labelNames: ["method"],
    registers: [this.registry],
  });
  private readonly external = new Histogram({
    name: "datamap_external_request_duration_seconds",
    help: "Time spent in calls to other services",
    labelNames: ["service", "operation", "outcome"],
    buckets: DURATION_BUCKETS,
    registers: [this.registry],
  });
  private readonly logins = new Counter({
    name: "datamap_webapp_logins_total",
    help: "Sign-ins, by provider",
    labelNames: ["provider", "outcome"],
    registers: [this.registry],
  });
  private readonly vitals = new Histogram({
    name: "datamap_web_vitals_seconds",
    help: "Web Vitals measured in the browser",
    labelNames: ["metric", "page"],
    buckets: VITAL_BUCKETS,
    registers: [this.registry],
  });
  private readonly cls = new Histogram({
    name: "datamap_web_vitals_cls",
    help: "Cumulative Layout Shift measured in the browser",
    labelNames: ["page"],
    buckets: CLS_BUCKETS,
    registers: [this.registry],
  });
  private readonly pageViews = new Counter({
    name: "datamap_web_page_views_total",
    help: "Pages shown in the browser",
    labelNames: ["page"],
    registers: [this.registry],
  });
  private readonly webErrors = new Counter({
    name: "datamap_web_errors_total",
    help: "Uncaught errors in the browser",
    labelNames: ["page"],
    registers: [this.registry],
  });
  private readonly uiEvents = new Counter({
    name: "datamap_web_ui_events_total",
    help: "Features used in the browser",
    labelNames: ["event", "page"],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
    (globalThis as { __datamapRecordExternalCall?: unknown }).__datamapRecordExternalCall = (
      service: string,
      operation: string,
      outcome: CallOutcome,
      seconds: number
    ) => this.external.labels(service, operation, outcome).observe(seconds);
  }

  recordRequest(
    method: string,
    route: string,
    status: number,
    seconds: number,
    requestBytes?: number,
    responseBytes?: number
  ): void {
    this.requests.labels(method, route, String(status), "none").inc();
    this.duration.labels(method, route).observe(seconds);
    if (requestBytes !== undefined) this.requestSize.labels(method, route).observe(requestBytes);
    if (responseBytes !== undefined) this.responseSize.labels(method, route).observe(responseBytes);
  }

  recordLogin(provider: string, outcome: "success" | "failure" | "pending"): void {
    this.logins.labels(provider, outcome).inc();
  }

  recordTelemetry(events: TelemetryEvent[]): number {
    let accepted = 0;
    for (const event of events.slice(0, TELEMETRY_MAX_EVENTS_PER_BATCH)) {
      if (this.recordOne(event)) accepted += 1;
    }
    return accepted;
  }

  private recordOne(event: TelemetryEvent): boolean {
    const page = pageLabel(event?.page);
    switch (event?.type) {
      case "vital": {
        const value = Number(event.value);
        if (!Number.isFinite(value) || value < 0) return false;
        if (event.name === "CLS") {
          this.cls.labels(page).observe(Math.min(value, 10));
          return true;
        }
        if (!(TIMED_VITALS as readonly string[]).includes(event.name)) return false;
        this.vitals.labels(event.name, page).observe(Math.min(value / 1000, MAX_VITAL_SECONDS));
        return true;
      }
      case "pageview":
        this.pageViews.labels(page).inc();
        return true;
      case "error":
        this.webErrors.labels(page).inc();
        return true;
      case "ui": {
        const name = uiEventLabel(event.event);
        if (!name) return false;
        this.uiEvents.labels(name, page).inc();
        return true;
      }
      default:
        return false;
    }
  }
}

// On globalThis: Next compiles pages and API routes into separate bundles, each
// with its own copy of this module, and they must share one registry.
export function getMetrics(): Metrics {
  const holder = globalThis as { __datamapMetrics?: Metrics };
  holder.__datamapMetrics ??= new Metrics();
  return holder.__datamapMetrics;
}

export function routeOf(url: string | undefined, query: Record<string, string | string[] | undefined>): string {
  const [path, search = ""] = (url ?? "").split("?");
  const fromSearch = new URLSearchParams(search);
  let route = path;

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || fromSearch.has(key)) continue;
    if (Array.isArray(value)) {
      const tail = "/" + value.map(encodeURIComponent).join("/");
      if (route.endsWith(tail)) route = route.slice(0, -tail.length) + `/[...${key}]`;
    } else {
      route = route
        .split("/")
        .map((segment) => (segment === encodeURIComponent(value) ? `[${key}]` : segment))
        .join("/");
    }
  }
  return route;
}
