import React from "react";
import Layout from "../../components/Layout";
import { getUser, userSignOut } from "../../lib/user";
import Link from "next/link";
import { CardItem } from "../../components/DatasetDetails/CardItem";
import Router, { useRouter } from "next/router";
import LoggedLayout from "../../components/LoggedLayout";

export default function ProfilePage() {
  const user = getUser();
  const router = useRouter();

  function signOut() {
    userSignOut();
    Router.push("/");
  }

  if (user) {
    return (
      <LoggedLayout>
        <h2>Profile</h2>
        <div className="py-8 mb-60">
          <CardItem className="py-4" title="Name">
            {user.name}
          </CardItem>
          <CardItem className="py-4" title="ORCID">
            <a href={`https://orcid.org/${user.orcid}`} target="_blank">
              {user.orcid}
            </a>
          </CardItem>
          <br />

          <button className="btn-primary" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </LoggedLayout>
    );
  }

  return (
    <LoggedLayout>
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
