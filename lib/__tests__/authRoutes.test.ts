import { expect, test } from '@jest/globals';
import { confirmEmailUrlFor, loginPhaseFor, loginTabFor, loginUrlFor, pendingSessionRedirect, safeCallbackUrl, SIGN_OUT_CALLBACK_URL } from "../authRoutes";
import { ROUTE_PAGE_CONFIRM_EMAIL } from "../../contants/InternalRoutesConstants";

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
  callbackUrl                           | expected
  ${"https://evil.example/app"}         | ${"/"}
  ${"//evil.example/app"}               | ${"/"}
  ${"/app/datasets"}                    | ${"/app/datasets"}
  ${""}                                 | ${"/"}
  ${undefined}                          | ${"/"}
  ${"/\\evil.com"}                      | ${"/"}
  ${"/app\u0000/evil"}                  | ${"/"}
  ${"%"}                                | ${"/"}
  ${"%E0%A4%A"}                         | ${"/"}
  ${"%2Fapp%2Fdatasets%3Ftab%3Dsettings"} | ${"/app/datasets?tab=settings"}
  ${"/%2F%2Fevil.com"}                  | ${"/"}
`("keeps the callback URL used for signing in to an internal path ($callbackUrl)", ({ callbackUrl, expected }) => {
  expect(safeCallbackUrl(callbackUrl)).toBe(expected);
});

test("the confirmation page lives at /account/confirm-email", () => {
  expect(ROUTE_PAGE_CONFIRM_EMAIL).toBe("/account/confirm-email");
});

test("the confirmation page remembers where the person was going", () => {
  expect(confirmEmailUrlFor("/app/datasets/80f230be?tab=settings"))
    .toBe("/account/confirm-email?callbackUrl=%2Fapp%2Fdatasets%2F80f230be%3Ftab%3Dsettings");
});

test.each`
  returnTo
  ${"https://evil.example/app"}
  ${"//evil.example/app"}
  ${"/\\evil.example/app"}
  ${""}
  ${undefined}
`("a return path that is not internal becomes the home page ($returnTo)", ({ returnTo }) => {
  expect(confirmEmailUrlFor(returnTo)).toBe("/account/confirm-email?callbackUrl=%2F");
});

test("the confirmation page reads its callbackUrl back with the login page's sanitiser", () => {
  const url = new URL(confirmEmailUrlFor("/invitations/tok?x=1"), "http://localhost");

  expect(safeCallbackUrl(url.searchParams.get("callbackUrl"))).toBe("/invitations/tok?x=1");
});

test("a pending session on an app page is sent to confirm its email", () => {
  expect(pendingSessionRedirect(true, "/app/datasets/[datasetId]", "/app/datasets/d1"))
    .toBe("/account/confirm-email?callbackUrl=%2Fapp%2Fdatasets%2Fd1");
});

test("a pending session on the confirmation page stays there", () => {
  expect(pendingSessionRedirect(true, "/account/confirm-email", "/account/confirm-email?callbackUrl=%2F")).toBeNull();
});

test("a signed-in session has nothing to confirm", () => {
  expect(pendingSessionRedirect(false, "/app/home", "/app/home")).toBeNull();
});

test.each`
  rawCallbackUrl                     | expected
  ${"%2Finvitations%2Ftok%3Fx%3D1"}  | ${"/invitations/tok?x=1"}
  ${"/app/datasets/d1"}              | ${"/app/datasets/d1"}
  ${undefined}                       | ${"/"}
  ${"https%3A%2F%2Fevil.example"}    | ${"/"}
  ${["/a", "/b"]}                    | ${"/"}
  ${"%2Faccount%2Fconfirm-email"}    | ${"/app/home"}
`("a confirmed session on the confirmation page goes to its callbackUrl ($rawCallbackUrl)", ({ rawCallbackUrl, expected }) => {
  expect(pendingSessionRedirect(false, "/account/confirm-email", "/account/confirm-email", rawCallbackUrl as string | string[] | undefined)).toBe(expected);
});

test("on the login page, a pending session goes to confirm with the login page's sanitised callbackUrl", () => {
  expect(pendingSessionRedirect(true, "/account/login", "/account/login?callbackUrl=%2Finvitations%2Ftok", "%2Finvitations%2Ftok"))
    .toBe("/account/confirm-email?callbackUrl=%2Finvitations%2Ftok");
  expect(pendingSessionRedirect(true, "/account/login", "/account/login", "https%3A%2F%2Fevil.example"))
    .toBe("/account/confirm-email?callbackUrl=%2F");
  expect(pendingSessionRedirect(false, "/account/login", "/account/login", "%2Finvitations%2Ftok")).toBeNull();
});

test("a pending session on a public page is sent to confirm its email", () => {
  expect(pendingSessionRedirect(true, "/datasets/[datasetId]", "/datasets/d1"))
    .toBe("/account/confirm-email?callbackUrl=%2Fdatasets%2Fd1");
  expect(pendingSessionRedirect(true, "/", "/")).toBe("/account/confirm-email?callbackUrl=%2F");
});

test("API routes are never redirected", () => {
  expect(pendingSessionRedirect(true, "/api/auth/[...nextauth]", "/api/auth/session")).toBeNull();
});
