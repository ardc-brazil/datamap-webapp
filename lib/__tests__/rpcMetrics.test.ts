import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from "axios";

import rpc from "../rpc";

function answer(status: number) {
  return async (config: InternalAxiosRequestConfig) => {
    const response = { status, statusText: "", data: {}, headers: {}, config };
    if (status >= 400) {
      throw new AxiosError("failed", "ERR_BAD_RESPONSE", config, null, response);
    }
    return response;
  };
}

describe("calls to the gatekeeper", () => {
  const recorder = jest.fn();
  const originalAdapter = rpc.defaults.adapter;

  beforeEach(() => {
    (globalThis as any).__datamapRecordExternalCall = recorder;
  });

  afterEach(() => {
    rpc.defaults.adapter = originalAdapter;
    delete (globalThis as any).__datamapRecordExternalCall;
  });

  it("are timed under their route, without the ids", async () => {
    rpc.defaults.adapter = answer(200);

    await rpc.get("/datasets/7a9b5d5e-fa6d-4c18-a42c-34f28f1b2c3d");

    expect(recorder).toHaveBeenCalledWith(
      "gatekeeper",
      "GET /datasets/{id}",
      "success",
      expect.any(Number)
    );
  });

  it("are recorded with the outcome of a refusal, and the error still reaches the caller", async () => {
    rpc.defaults.adapter = answer(404);

    await expect(rpc.get("/datasets/")).rejects.toBeInstanceOf(AxiosError);

    expect(recorder).toHaveBeenCalledWith("gatekeeper", "GET /datasets/", "client_error", expect.any(Number));
  });

  it("are recorded as timeouts when axios gives up", async () => {
    rpc.defaults.adapter = async (config) => {
      throw new AxiosError("timeout of 10000ms exceeded", "ECONNABORTED", config);
    };

    await expect(rpc.post("/datasets/", {}, { headers: new AxiosHeaders() })).rejects.toBeDefined();

    expect(recorder).toHaveBeenCalledWith("gatekeeper", "POST /datasets/", "timeout", expect.any(Number));
  });
});
