import Link from "next/link";

import AvatarButton from "../Profile/AvatarButton";
import { useSession } from "next-auth/react";

export function ActionItemsNavBar() {
  const { data: session, status } = useSession();

  if (status == "authenticated") {
    return <AvatarButton />;
  } else {
    return (
      <>
        <Link
          href={{
            pathname: "/account/login",
            query: { phase: "sign-in", tenancy:"datamap/production/data-amazon" },
          }}
        >
          <a href="#" className="btn-primary-outline mx-2">
            Sign in
          </a>
        </Link>

        <Link
          href={{
            pathname: "/account/login",
            query: { phase: "register", tenancy:"datamap/production/data-amazon" },
          }}
        >
          <button className="btn-primary">Register</button>
        </Link>
      </>
    );
  }
}
