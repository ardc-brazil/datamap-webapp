import { shouldRetry } from "../rpc";

const refused = (method: string, extra = {}) => ({
  code: "ECONNREFUSED",
  config: { method, ...extra },
});

describe("shouldRetry", () => {
  it("retries a read the API never received", () => {
    expect(shouldRetry(refused("get"))).toBe(true);
    expect(shouldRetry(refused("GET"))).toBe(true);
    expect(shouldRetry(refused("head"))).toBe(true);
  });

  it("never retries a write, which could create something twice", () => {
    expect(shouldRetry(refused("post"))).toBe(false);
    expect(shouldRetry(refused("put"))).toBe(false);
    expect(shouldRetry(refused("delete"))).toBe(false);
    expect(shouldRetry(refused("patch"))).toBe(false);
  });

  it("retries only once, so a refusing API is not hammered", () => {
    expect(shouldRetry(refused("get", { __retried: true }))).toBe(false);
  });

  it("does not retry a request the API answered", () => {
    expect(
      shouldRetry({
        code: "ECONNREFUSED",
        response: { status: 500 },
        config: { method: "get" },
      }),
    ).toBe(false);
  });

  it("does not retry a failure that repeating cannot fix", () => {
    expect(shouldRetry({ code: "ETIMEDOUT", config: { method: "get" } })).toBe(false);
    expect(shouldRetry({ code: undefined, config: { method: "get" } })).toBe(false);
  });

  it("treats a missing method as the read axios defaults to", () => {
    expect(shouldRetry({ code: "ECONNREFUSED", config: {} })).toBe(true);
  });

  it("survives an error with no config at all", () => {
    expect(shouldRetry({ code: "ECONNREFUSED" })).toBe(false);
    expect(shouldRetry({})).toBe(false);
  });
});
