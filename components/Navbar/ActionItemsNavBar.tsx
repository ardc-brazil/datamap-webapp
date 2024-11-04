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
            query: { phase: "sign-in", tenancy: "datamap/production/data-amazon" },
          }}
          className="btn-primary"
        >
          Sign in
        </Link>
      </>
    );
  }
}
