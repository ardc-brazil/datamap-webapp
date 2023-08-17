import Link from "next/link";
import Router from "next/router";
import { CardItem } from "../../../components/DatasetDetails/CardItem";
import LoggedLayout from "../../../components/LoggedLayout";

import { signOut, useSession } from "next-auth/react";
import { NewContext } from "../../../lib/appLocalContext";
import { getUserByUID } from "../../../lib/users";

export default function ProfilePage(props) {
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
            {session.user.image &&
              <CardItem className="py-4" title="Image">
                <img src={session.user.image} className="w-32 rounded border-2 border-primary-400" />
                <span className="text-xs text-primary-300">{session.user.image}</span>
              </CardItem>
            }
            <CardItem className="py-4" title="ID">
              {props.data.id}
            </CardItem>
            <CardItem className="py-4" title="Name">
              {props.data.name}
            </CardItem>
            <CardItem className="py-4" title="Email">
              {props.data.email}
            </CardItem>
            <CardItem className="py-4" title="Roles">
              <ul>
                {props.data.roles.map((role, index) =>
                  <li className="ml-4 list-disc" key={index}>{role}</li>
                )}
              </ul>
            </CardItem>
            <CardItem className="py-4" title="Providers">
              <ul>
                {props.data.providers.map((provider, index) =>
                  <li className="ml-4 list-disc" key={index}>{provider.name} - {provider.reference}</li>
                )}
              </ul>
            </CardItem>
            <CardItem className="py-4" title="Created At">
              {props.data.created_at}
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

export async function getServerSideProps(context) {

  // Fetch data frm external API
  const data = await getUserByUID(await NewContext(context.req));

  // Pass data to the page via props
  return { props: { data } };
}

ProfilePage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};