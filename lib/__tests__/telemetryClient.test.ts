/** @jest-environment jsdom */

import {
  flushTelemetry,
  reportWebVital,
  setCurrentPage,
  trackError,
  trackPageView,
  trackUiEvent,
} from "../telemetryClient";

function sentBatches(beacon: jest.Mock): any[] {
  return beacon.mock.calls.map(([, blob]) => (blob as Blob & { __text: string }).__text).map((text) => JSON.parse(text));
}

describe("the browser telemetry client", () => {
  let beacon: jest.Mock;
  const OriginalBlob = global.Blob;

  beforeEach(() => {
    beacon = jest.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", { value: beacon, configurable: true });
    // jsdom's Blob cannot be read back synchronously; keep the text alongside it.
    (global as any).Blob = class {
      __text: string;
      constructor(parts: string[]) {
        this.__text = parts.join("");
      }
    };
    flushTelemetry();
    beacon.mockClear();
  });

  afterEach(() => {
    (global as any).Blob = OriginalBlob;
  });

  it("sends nothing when there is nothing to say", () => {
    flushTelemetry();

    expect(beacon).not.toHaveBeenCalled();
  });

  it("batches events and sends them to the BFF in one beacon", () => {
    setCurrentPage("/app/datasets/[datasetId]");
    trackPageView();
    trackUiEvent("download_clicked");

    flushTelemetry();

    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0][0]).toBe("/api/telemetry");
    expect(sentBatches(beacon)[0].events).toEqual([
      { type: "pageview", page: "/app/datasets/[datasetId]" },
      { type: "ui", event: "download_clicked", page: "/app/datasets/[datasetId]" },
    ]);
  });

  it("reports a web vital with the page it was measured on", () => {
    reportWebVital({ name: "LCP", value: 1234.5 }, "/app/home");

    flushTelemetry();

    expect(sentBatches(beacon)[0].events).toEqual([
      { type: "vital", name: "LCP", value: 1234.5, page: "/app/home" },
    ]);
  });

  it("ignores the metrics Next adds that are not web vitals", () => {
    reportWebVital({ name: "Next.js-hydration", value: 10 }, "/");

    flushTelemetry();

    expect(beacon).not.toHaveBeenCalled();
  });

  it("reports an uncaught error by message only", () => {
    setCurrentPage("/");
    trackError(new Error("x is undefined"));

    flushTelemetry();

    expect(sentBatches(beacon)[0].events).toEqual([
      { type: "error", page: "/", message: "x is undefined" },
    ]);
  });

  it("empties the queue once sent", () => {
    trackPageView();
    flushTelemetry();
    flushTelemetry();

    expect(beacon).toHaveBeenCalledTimes(1);
  });

  it("never lets reporting break the page", () => {
    beacon.mockImplementation(() => {
      throw new Error("blocked by an extension");
    });
    trackPageView();

    expect(() => flushTelemetry()).not.toThrow();
  });
});
