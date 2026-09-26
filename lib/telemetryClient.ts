// Browser side of /api/telemetry. Reporting is best effort: nothing here may
// throw into the page, and a lost batch is acceptable.

import { TELEMETRY_MAX_EVENTS_PER_BATCH, TIMED_VITALS, UiEvent } from "../contants/TelemetryConstants";

const ENDPOINT = "/api/telemetry";
const FLUSH_INTERVAL_MS = 10_000;
const VITALS = new Set<string>([...TIMED_VITALS, "CLS"]);

type Event = Record<string, unknown>;

let queue: Event[] = [];
let currentPage = "/";
let started = false;

function enqueue(event: Event): void {
  queue.push(event);
  if (queue.length >= TELEMETRY_MAX_EVENTS_PER_BATCH) flushTelemetry();
}

export function setCurrentPage(page: string): void {
  currentPage = page;
}

export function trackPageView(page: string = currentPage): void {
  enqueue({ type: "pageview", page });
}

export function trackUiEvent(event: UiEvent, page: string = currentPage): void {
  enqueue({ type: "ui", event, page });
}

export function trackError(error: unknown, page: string = currentPage): void {
  const message = error instanceof Error ? error.message : String(error);
  enqueue({ type: "error", page, message: message.slice(0, 300) });
}

export function reportWebVital(metric: { name: string; value: number }, page: string = currentPage): void {
  if (VITALS.has(metric.name)) {
    enqueue({ type: "vital", name: metric.name, value: metric.value, page });
  }
}

export function flushTelemetry(): void {
  if (!queue.length) return;
  const events = queue.slice(0, TELEMETRY_MAX_EVENTS_PER_BATCH);
  queue = queue.slice(events.length);
  try {
    const body = new Blob([JSON.stringify({ events })], { type: "application/json" });
    if (!navigator.sendBeacon?.(ENDPOINT, body)) {
      void fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => undefined);
    }
  } catch {
    // An ad blocker or a closed page; the batch is dropped.
  }
}

export function startTelemetry(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.setInterval(flushTelemetry, FLUSH_INTERVAL_MS);
  // The last chance to send anything before the tab goes away.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushTelemetry();
  });
  window.addEventListener("error", (event) => trackError(event.error ?? event.message));
  window.addEventListener("unhandledrejection", (event) => trackError(event.reason));
}
