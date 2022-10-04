import { deleteCookie, getCookie, hasCookie, setCookie } from "cookies-next";

const COOKIE_NAME = "auth";

export function getUser() {
  if (hasCookie(COOKIE_NAME)) {
    return JSON.parse(getCookie(COOKIE_NAME) as string);
  }

  return null;
}

export function userSignOut() {
  deleteCookie(COOKIE_NAME);
}

export function setUser(user, req, res) {
  setCookie(COOKIE_NAME, user, { req, res });
}
