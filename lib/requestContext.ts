/**
 * The request id, for code that runs on the server.
 *
 * Kept apart from `logging.ts` and reached only from server-side modules:
 * `async_hooks` cannot be bundled for the browser, and `lib/rpc.ts` is imported
 * by `gateways/BFFAPI.ts`, which pages pull into the client bundle. Importing
 * this from anything the browser can reach breaks `next build`.
 */

import { AsyncLocalStorage } from "async_hooks";

const requestIdStorage = new AsyncLocalStorage<string>();

export function withRequestId<T>(requestId: string, run: () => T): T {
  return requestIdStorage.run(requestId, run);
}

export function currentRequestId(): string | undefined {
  return requestIdStorage.getStore();
}
