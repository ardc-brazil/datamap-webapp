import { expect, test } from '@jest/globals';
import { loginUrlFor, SIGN_OUT_CALLBACK_URL } from "../authRoutes";

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
