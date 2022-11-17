import Link from "next/link";

import { getUser } from "../../lib/user";

export function ActionItemsNavBar() {
  const user = getUser();
  if (user) {
    return (
      <Link href="/profile">
        <a className="btn-primary-outline mx-2">{user.name}</a>
      </Link>
    );
  }

  return (
    <>
      <Link
        href={{
          pathname: "/account/login",
          query: { phase: "sign-in" },
        }}
      >
        <a href="#" className="btn-primary-outline mx-2">
          Sign in
        </a>
      </Link>

      <Link
        href={{
          pathname: "/account/login",
          query: { phase: "register" },
        }}
      >
        <button className="btn-primary">Register</button>
      </Link>
    </>
  );
}
