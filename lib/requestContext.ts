// Server-side only: `async_hooks` cannot be bundled for the browser, so
// importing this from anything the client reaches breaks `next build`.

import { AsyncLocalStorage } from "async_hooks";

const requestIdStorage = new AsyncLocalStorage<string>();

export function withRequestId<T>(requestId: string, run: () => T): T {
  return requestIdStorage.run(requestId, run);
}

export function currentRequestId(): string | undefined {
  return requestIdStorage.getStore();
}
