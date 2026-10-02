import { callOutcome, operationOf, recordExternalCall } from "../externalCalls";

describe("the name a gatekeeper call is recorded under", () => {
  it("replaces ids, so one route is one series", () => {
    expect(
      operationOf("get", "/datasets/7a9b5d5e-fa6d-4c18-a42c-34f28f1b2c3d/versions/2/files/08a711f0-a304-4b05-83ef-c6d41a7b8c9d")
    ).toBe("GET /datasets/{id}/versions/{n}/files/{id}");
  });

  it("drops the query string, which can carry anything", () => {
    expect(operationOf("get", "/datasets/?full_text=ozone&page=2")).toBe("GET /datasets/");
  });

  it("keeps a route without ids as it is", () => {
    expect(operationOf("post", "/datasets/")).toBe("POST /datasets/");
  });

  it("replaces a provider reference, which is an id too", () => {
    expect(operationOf("get", "/users/providers/orcid/0000-0002-1825-0097")).toBe(
      "GET /users/providers/{provider}/{ref}"
    );
  });

  it("does not trust a whole url with a host in it", () => {
    expect(operationOf("get", "http://gatekeeper:9092/api/v1/datasets/")).toBe("GET /api/v1/datasets/");
  });

  it("replaces an invitation token, which is a credential, not an id", () => {
    expect(operationOf("GET", "/invitations/AbC123-_xyz")).toBe("GET /invitations/{token}");
  });

  it("keeps the accept route literal", () => {
    expect(operationOf("post", "/invitations/accept")).toBe("POST /invitations/accept");
  });

  it("replaces an anonymous link token, which is a credential, not an id", () => {
    expect(operationOf("GET", "/anonymous/AbC123-_xyz")).toBe("GET /anonymous/{token}");
  });
});

describe("the outcome of a call", () => {
  it("is success when the gatekeeper answered 2xx", () => {
    expect(callOutcome(200, undefined)).toBe("success");
  });

  it("is a client error when it refused the request", () => {
    expect(callOutcome(404, new Error("Not Found"))).toBe("client_error");
  });

  it("is a server error when it failed", () => {
    expect(callOutcome(502, new Error("Bad Gateway"))).toBe("server_error");
  });

  it("is a timeout when axios gave up waiting", () => {
    expect(callOutcome(undefined, { code: "ECONNABORTED", message: "timeout of 10000ms exceeded" })).toBe("timeout");
    expect(callOutcome(undefined, { code: "ETIMEDOUT" })).toBe("timeout");
  });

  it("is an error when nothing answered", () => {
    expect(callOutcome(undefined, { code: "ECONNREFUSED" })).toBe("error");
  });
});

describe("recording a call", () => {
  afterEach(() => {
    delete (globalThis as any).__datamapRecordExternalCall;
  });

  it("does nothing where no recorder was installed, as in the browser", () => {
    expect(() => recordExternalCall("gatekeeper", "GET /x", "success", 0.1)).not.toThrow();
  });

  it("hands the call to the recorder the server installed", () => {
    const recorder = jest.fn();
    (globalThis as any).__datamapRecordExternalCall = recorder;

    recordExternalCall("gatekeeper", "GET /x", "timeout", 10);

    expect(recorder).toHaveBeenCalledWith("gatekeeper", "GET /x", "timeout", 10);
  });
});
