import Link from "next/link";
import Router from "next/router";
import { CardItem } from "../../../components/DatasetDetails/CardItem";
import LoggedLayout from "../../../components/LoggedLayout";

import { signOut, useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  function clickSignOut() {
    signOut();
    Router.push("/");
  }

  if (status === "authenticated") {
    return (
      <LoggedLayout noPadding={false}>
        <div className="w-full">
          <h2>Profile</h2>
          <div className="py-6 mb-60">
            <CardItem className="py-4" title="Image">
              <img src={session.user.image} className="w-32 rounded border-2 border-primary-400" />
              <span className="text-xs text-primary-300">{session.user.image}</span>
            </CardItem>
            <CardItem className="py-4" title="Name">
              {session.user.name}
            </CardItem>
            <CardItem className="py-4" title="Email">
              {session.user.email}
            </CardItem>
            <br />

            <button className="btn-primary" onClick={clickSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout noPadding={false}>
      <div className="py-8">
        <p>User is not authenticated.</p>
        <p className="text-primary-500 text-left mt-6">
          Have an account?&nbsp;
          <Link
            href={{
              pathname: "/account/login",
              query: { phase: "sign-in" },
            }}
          >
            <a className="text-primary-800 cursor-pointer">Sign in</a>
          </Link>
        </p>
      </div>
    </LoggedLayout>
  );
}

ProfilePage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};