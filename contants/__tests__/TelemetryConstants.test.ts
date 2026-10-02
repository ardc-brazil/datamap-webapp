import { readdirSync, statSync } from "fs";
import { join, relative } from "path";

import { PAGES, pageLabel, uiEventLabel } from "../TelemetryConstants";

const PAGES_DIR = join(__dirname, "..", "..", "pages");

function pageTemplates(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return entry === "api" || entry === "__tests__" ? [] : pageTemplates(path);
    }
    if (!/\.(tsx|ts|jsx|js)$/.test(entry) || entry.startsWith("_")) {
      return [];
    }
    const route = "/" + relative(PAGES_DIR, path).replace(/\.(tsx|ts|jsx|js)$/, "");
    return [route.replace(/\/index$/, "") || "/"];
  });
}

describe("the pages the browser may report", () => {
  it("include every page the app has, so a new one is not filed as other", () => {
    const missing = pageTemplates(PAGES_DIR).filter((page) => !PAGES.includes(page));

    expect(missing).toEqual([]);
  });

  it("are the router's templates, never a path with an id in it", () => {
    expect(pageLabel("/app/datasets/[datasetId]")).toBe("/app/datasets/[datasetId]");
    expect(pageLabel("/app/datasets/7a9b5d5e-fa6d-4c18")).toBe("other");
  });

  it("reject anything a stranger could invent", () => {
    expect(pageLabel("/<script>")).toBe("other");
    expect(pageLabel(undefined)).toBe("other");
  });
});

describe("the ui events the browser may report", () => {
  it("accept a known event", () => {
    expect(uiEventLabel("download_clicked")).toBe("download_clicked");
  });

  it("drop an unknown one rather than make a series of it", () => {
    expect(uiEventLabel("made_up_event_1234")).toBeUndefined();
  });
});

describe("the embargo telemetry", () => {
  it("knows the new pages", () => {
    for (const page of [
      "/app/datasets/shared",
      "/anonymous/[token]",
      "/invitations/[token]",
      "/doi/datasets/[datasetId]/versions/[versionName]",
    ]) {
      expect(pageLabel(page)).toBe(page);
    }
  });

  it("accepts the new ui events", () => {
    for (const event of ["embargo_set", "embargo_extended", "dataset_shared", "anonymous_link_created"]) {
      expect(uiEventLabel(event)).toBe(event);
    }
  });
});
