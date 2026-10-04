import { expect, test } from '@jest/globals';
import { loginPhaseFor, loginTabFor, loginUrlFor, safeCallbackUrl, SIGN_OUT_CALLBACK_URL } from "../authRoutes";

test("sends a signed-out visitor to the login page without an error", () => {
  const url = loginUrlFor("/app/datasets");

  expect(url).toBe("/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fdatasets");
  expect(url).not.toContain("error=");
});

test("keeps the concrete path and query so the visitor returns to the same page", () => {
  expect(loginUrlFor("/app/datasets/80f230be?tab=settings"))
    .toBe("/account/login?phase=sign-in&callbackUrl=%2Fapp%2Fdatasets%2F80f230be%3Ftab%3Dsettings");
});

test.each`
  returnTo
  ${"https://evil.example/app"}
  ${"//evil.example/app"}
  ${""}
  ${undefined}
`("falls back to the home page for a return path that is not internal ($returnTo)", ({ returnTo }) => {
  expect(loginUrlFor(returnTo)).toBe("/account/login?phase=sign-in&callbackUrl=%2F");
});

test("signing out lands on the public home page", () => {
  expect(SIGN_OUT_CALLBACK_URL).toBe("/");
});

test.each([
  ["sign-in", 0],
  ["sign-up", 1],
  [undefined, 0],
  ["made-up", 0],
  [["sign-up", "sign-in"], 0],
] as [string | string[] | undefined, number][])("the login page opens the tab for phase %p", (phase, tab) => {
  expect(loginTabFor(phase)).toBe(tab);
});

test("each tab writes its phase back", () => {
  expect(loginPhaseFor(0)).toBe("sign-in");
  expect(loginPhaseFor(1)).toBe("sign-up");
  expect(loginPhaseFor(7)).toBe("sign-in");
});

test.each`
  callbackUrl                      | expected
  ${"https://evil.example/app"}    | ${"/"}
  ${"//evil.example/app"}          | ${"/"}
  ${"/app/datasets"}               | ${"/app/datasets"}
  ${""}                            | ${"/"}
  ${undefined}                     | ${"/"}
`("keeps the callback URL used for signing in to an internal path ($callbackUrl)", ({ callbackUrl, expected }) => {
  expect(safeCallbackUrl(callbackUrl)).toBe(expected);
});
