import Link from "next/link";
import Router from "next/router";
import { CardItem } from "../../../components/DatasetDetails/CardItem";
import LoggedLayout from "../../../components/LoggedLayout";

import { signOut, useSession } from "next-auth/react";
import { ROUTE_PAGE_ERROR } from "../../../contants/InternalRoutesConstants";
import { NewContext } from "../../../lib/appLocalContext";
import { getUserByUID } from "../../../lib/users";

export default function ProfilePage(props) {
  const { data: session, status } = useSession();

  function clickSignOut() {
    signOut({
      callbackUrl: process.env.NEXT_PUBLIC_DATAMAP_HOMEPAGE,
      redirect: true,
    })
  }

  if (props.error) {
    Router.push(ROUTE_PAGE_ERROR(props.error));
    return <></>
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
              {props?.data?.id}
            </CardItem>
            <CardItem className="py-4" title="Name">
              {props?.data?.name}
            </CardItem>
            <CardItem className="py-4" title="Email">
              {props?.data?.email}
            </CardItem>
            <CardItem className="py-4" title="Roles">
              <ul>
                {props?.data?.roles.map((role, index) =>
                  <li className="ml-4 list-disc" key={index}>{role}</li>
                )}
              </ul>
            </CardItem>
            <CardItem className="py-4" title="Providers">
              <ul>
                {props?.data?.providers.map((provider, index) =>
                  <li className="ml-4 list-disc" key={index}>{provider.name} - {provider.reference}</li>
                )}
              </ul>
            </CardItem>
            <CardItem className="py-4" title="Created At">
              {props?.data?.created_at}
            </CardItem>
            <CardItem className="py-4" title="Tenancies">
              {props?.data?.tenancies?.length > 0 ? (
                <ul>
                  {props?.data?.tenancies.map((tenancy, index) =>
                    <li className="ml-4 list-disc" key={index}>{tenancy}</li>
                  )}
                </ul>
              ) : (
                <i>Empty - no tenancy set for user.</i>
              )}
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
            className="text-primary-800 cursor-pointer"
          >
            Sign in
          </Link>
        </p>
      </div>
    </LoggedLayout>
  );
}

export async function getServerSideProps(context) {

  // Fetch data frm external API
  const ctx = await NewContext(context.req);
  if (!ctx.uid) {
    return { props: {} }
  }

  try {
    const data = await getUserByUID(ctx);

    // Pass data to the page via props
    return { props: { data } };
  } catch (err) {
    return {
      props: {
        error: {
          status: err?.response?.status,
          info: err?.response?.statusText
        }
      }
    }
  }
}

ProfilePage.auth = {
  role: "admin",
  loading: <div>loading...</div>,
};