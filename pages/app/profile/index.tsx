import Link from "next/link";
import Router, { useRouter } from "next/router";
import { ConnectOrcid } from "../../../components/Account/ConnectOrcid";
import { OrcidLinkOutcome } from "../../../components/Account/OrcidLinkOutcome";
import { PasswordSignInMethod } from "../../../components/Account/PasswordSignInMethod";
import LoggedLayout from "../../../components/LoggedLayout";

import { SIGN_OUT_CALLBACK_URL } from "../../../lib/authRoutes";
import { signOut, useSession } from "next-auth/react";
import { MaterialSymbol } from "react-material-symbols";
import { useTenancyStore } from "../../../components/TenancyStore";
import { ORCID_LINK_OUTCOME_PARAM } from "../../../contants/AccountConstants";
import { ROUTE_PAGE_ERROR, ROUTE_PAGE_TENANCY_SELECTOR } from "../../../contants/InternalRoutesConstants";
import { AppLocalContext, NewContext } from "../../../lib/appLocalContext";
import { getUserByUID, hasSignInProvider } from "../../../lib/users";

export default function ProfilePage(props) {
  const { data: session, status } = useSession();
  const tenancySelected = useTenancyStore((state) => state.tenancySelected)
  const { query } = useRouter();

  function clickSignOut() {
    signOut({ callbackUrl: SIGN_OUT_CALLBACK_URL });
  }

  if (props.error) {
    Router.replace(ROUTE_PAGE_ERROR(props.error));
    return <></>
  }

  if (status === "authenticated") {
    const user = props?.data;
    const tenancies: string[] = user?.tenancies ?? [];

    return (
      <LoggedLayout noPadding={false}>
        <div className="w-full max-w-5xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <span className="flex flex-none items-center justify-center w-16 h-16 rounded-full border border-primary-300 bg-primary-0 overflow-hidden">
                {session.user.image
                  ? <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                  : <img src="/img/avatar-placeholder.svg" alt="" className="w-8 h-8 opacity-70" />}
              </span>
              <div className="min-w-0">
                <h2 className="m-0">{user?.name ?? session.user.name}</h2>
                <p className="m-0 mt-1 text-[15px] text-primary-600">{user?.email ?? session.user.email}</p>
              </div>
            </div>
            <button className="btn-primary-outline m-0 flex items-center gap-2" onClick={clickSignOut}>
              <MaterialSymbol icon="logout" size={18} weight={400} grade={-25} />
              Sign out
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 items-start">
            <div className="flex flex-col gap-10 min-w-0">
              <ProfileSection title="Tenancies" description="The namespaces you can work in. Datasets and notebooks belong to the selected one.">
                {tenancies.length > 0 ? (
                  <ul className="divide-y divide-primary-100">
                    {tenancies.map((tenancy) => {
                      const current = tenancy === tenancySelected;
                      return (
                        <li key={tenancy} className="flex items-center justify-between gap-4 px-4 h-12">
                          <span className="flex items-center gap-3 min-w-0">
                            <MaterialSymbol icon="tenancy" size={20} weight={400} grade={-25} className="flex-none text-primary-500" />
                            <span className="truncate font-mono text-[13px] text-primary-900">{tenancy}</span>
                          </span>
                          {current && <span className="flex-none px-2.5 py-[3px] rounded-full bg-secondary-500 text-xs font-semibold text-primary-900">Current</span>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="m-0 px-4 py-3 text-sm italic text-primary-500">No tenancy set for this user yet.</p>
                )}
                <div className="flex justify-end border-t border-primary-100 px-4 py-3">
                  <button className="btn-primary-outline btn-small m-0 flex items-center gap-2" onClick={() => Router.push(ROUTE_PAGE_TENANCY_SELECTOR)}>
                    <MaterialSymbol icon="swap_horiz" size={18} weight={400} grade={-25} />
                    Switch tenancy
                  </button>
                </div>
              </ProfileSection>

              <ProfileSection title="Sign-in methods">
                <OrcidLinkOutcome outcome={query[ORCID_LINK_OUTCOME_PARAM]} />
                {user ? (
                  <ul className="divide-y divide-primary-100">
                    {(user.providers ?? []).map((provider, index) => (
                      <li key={index} className="grid grid-cols-[140px_minmax(0,1fr)] items-center gap-4 px-4 h-12 text-sm">
                        <span className="capitalize text-primary-500">{provider.name}</span>
                        <span className="truncate text-primary-900">{provider.reference}</span>
                      </li>
                    ))}
                    <PasswordSignInMethod user={user} />
                    {!hasSignInProvider(user, "orcid") && <ConnectOrcid accountEmail={user.email} />}
                  </ul>
                ) : (
                  <p className="m-0 px-4 py-3 text-sm italic text-primary-500">No sign-in method linked.</p>
                )}
              </ProfileSection>
            </div>

            <div className="rounded-lg border border-primary-200 bg-primary-0 px-4 py-1">
              <FactRow label="Roles">
                <span className="flex flex-wrap justify-end gap-1.5">
                  {user?.roles?.length > 0
                    ? user.roles.map((role) => (
                      <span key={role} className="px-2 py-[2px] rounded-full bg-primary-100 text-xs font-semibold text-primary-700">{role}</span>
                    ))
                    : <span className="text-primary-500">None</span>}
                </span>
              </FactRow>
              <FactRow label="Member since">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { dateStyle: "medium" }) : "—"}
              </FactRow>
              <FactRow label="User ID" last>
                <span className="font-mono text-xs break-all text-right">{user?.id}</span>
              </FactRow>
            </div>
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

function ProfileSection(props: { title: string, description?: string, children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="m-0 text-lg">{props.title}</h3>
        {props.description && <p className="m-0 mt-1 text-sm text-primary-600">{props.description}</p>}
      </div>
      <div className="rounded-lg border border-primary-200 bg-primary-0 overflow-hidden">
        {props.children}
      </div>
    </section>
  );
}

function FactRow(props: { label: string, children: React.ReactNode, last?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-3 text-sm ${props.last ? "" : "border-b border-primary-100"}`}>
      <span className="flex-none text-primary-500">{props.label}</span>
      <span className="min-w-0 font-medium text-primary-900">{props.children}</span>
    </div>
  );
}

export async function getServerSideProps(context) {

  // Fetch data frm external API
  let ctx = {} as AppLocalContext;
  try {
    ctx = await NewContext(context.req);
  } catch (e) {
    // Redirect to Tenancy Selector page if any error
    // Usually, the tenancy selected is not set in the cookie
    return {
      redirect: {
        destination: '/app/tenancy',
        permanent: true,
      }
    }
  }

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
