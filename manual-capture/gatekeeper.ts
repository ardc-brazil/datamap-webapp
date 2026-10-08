import { ADMIN_TENANCY, ADMIN_USER_ID, API_KEY, API_SECRET, GATEKEEPER_URL, MAILPIT_URL } from "./config";

type Json = Record<string, any>;

export function headers(userId?: string, tenancy?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": API_KEY,
    "X-Api-Secret": API_SECRET,
    ...(userId ? { "X-User-Id": userId } : {}),
    ...(tenancy ? { "X-Datamap-Tenancies": tenancy } : {}),
  };
}

export const asAdmin = () => headers(ADMIN_USER_ID, ADMIN_TENANCY);

export async function call(method: string, path: string, init: { headers: Record<string, string>; body?: Json | unknown[] }, expected: number[]): Promise<Json> {
  const response = await fetch(`${GATEKEEPER_URL}${path}`, {
    method,
    headers: init.headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await response.text();
  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${path} → ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

export async function messagesTo(address: string): Promise<Json[]> {
  const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`);
  return ((await response.json()) as Json).messages ?? [];
}

export async function dispatchEmails(): Promise<void> {
  await call("POST", "/internal/notifications/dispatch", { headers: headers() }, [200]);
}

export async function newestCode(address: string): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    await dispatchEmails();
    const found = await messagesTo(address);
    if (found.length > 0) {
      const newest = found.reduce((a, b) => (a.Created > b.Created ? a : b));
      const message = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${newest.ID}`)).json()) as Json;
      const code = /Your DataMap code: (\d{6})/.exec(message.Text)?.[1];
      if (code) {
        return code;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`nenhum código chegou para ${address}`);
}
