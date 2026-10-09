import path from "path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} não está definido; rode pelo \`make manual\`.`);
  }
  return value;
}

export const WEBAPP_URL = process.env.MANUAL_WEBAPP_URL ?? "http://localhost:3100";
export const GATEKEEPER_URL = process.env.MANUAL_GATEKEEPER_URL ?? "http://localhost:9094/api/v1";
export const MAILPIT_URL = process.env.MANUAL_MAILPIT_URL ?? "http://localhost:8025";

export const API_KEY = required("MANUAL_API_KEY");
export const API_SECRET = required("MANUAL_API_SECRET");
export const ADMIN_USER_ID = required("MANUAL_ADMIN_USER_ID");
export const ADMIN_TENANCY = required("MANUAL_ADMIN_TENANCY");

export const PASSWORD = "senha-do-guia-2026";

export const VIEWPORT = { width: 1280, height: 800 };
export const DEVICE_SCALE_FACTOR = 2;

export const IMAGE_DIR = path.resolve(__dirname, "../public/manual/img");
export const WORK_DIR = path.resolve(__dirname, ".run");
export const SEED_FILE = path.join(WORK_DIR, "seed.json");
export const FIXTURES_DIR = path.resolve(__dirname, "fixtures");
