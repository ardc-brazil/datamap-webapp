import { SIGN_OUT_CALLBACK_URL } from "../../lib/authRoutes";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Router from "next/router";
import { useEffect, useState } from "react";
import { MaterialSymbol, SymbolCodepoints } from "react-material-symbols";
import { MANUAL_LINK_LABEL, MANUAL_ROUTE } from "../../contants/ManualConstants";
import { ROUTE_PAGE_MEMBERS, ROUTE_PAGE_PROFILE, ROUTE_PAGE_TENANCY_SELECTOR } from "../../contants/InternalRoutesConstants";
import useComponentVisible from "../../hooks/UseComponentVisible";
import { useMyTenancies } from "../../hooks/UseTenancies";
import { useMembersPageTenancy } from "../../hooks/UseWorkspace";
import { RequestAccessDialog } from "../Tenancy/RequestAccessDialog";
import { useTenancyStore } from "../TenancyStore";

const AVATAR_PLACEHOLDER = "/img/avatar-placeholder.svg";

export default function AvatarButton(props) {
  const { data: session, status } = useSession();
  const [profileImage, setProfileImage] = useState(AVATAR_PLACEHOLDER);
  const tenancySelected = useTenancyStore((state) => state.tenancySelected)
  const { tenancy: membersTenancy } = useMembersPageTenancy();
  const { ref, isComponentVisible, setIsComponentVisible } = useComponentVisible(false);
  const [requesting, setRequesting] = useState(false);
  const { data: tenancies } = useMyTenancies();
  const canSwitch = (tenancies?.length ?? 0) > 1;

  function requestAccess() {
    setIsComponentVisible(false);
    setRequesting(true);
  }

  useEffect(() => {
    if (status == "authenticated") {
      if (session.user.image) {
        setProfileImage(session.user.image)
      }
    }
  }, []);

  function clickSignOut() {
    signOut({ callbackUrl: SIGN_OUT_CALLBACK_URL });
  }

  function onError(currentTarget) {
    setProfileImage(AVATAR_PLACEHOLDER);
  }

  function go(route: string) {
    setIsComponentVisible(false);
    Router.push(route);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={isComponentVisible}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-primary-300 bg-primary-0 overflow-hidden hover:border-primary-500"
        onClick={() => setIsComponentVisible(!isComponentVisible)}
      >
        <Avatar src={profileImage} onError={onError} />
      </button>

      {isComponentVisible && (
        <div
          ref={ref}
          role="menu"
          className="absolute right-0 top-10 z-50 w-72 rounded-lg border border-primary-200 bg-primary-0 shadow-lg"
        >
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-primary-100 rounded-t-lg"
            onClick={() => go(ROUTE_PAGE_PROFILE)}
          >
            <span className="flex flex-none items-center justify-center w-10 h-10 rounded-full border border-primary-300 bg-primary-0 overflow-hidden">
              <Avatar src={profileImage} onError={onError} large />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-primary-900">{session?.user?.name}</span>
              <span className="truncate text-[13px] text-primary-500">{session?.user?.email}</span>
            </span>
          </button>

          {tenancySelected && (
            <div className="px-4 pb-3">
              <TenancyBadge tenancySelected={tenancySelected} />
            </div>
          )}

          <div className="border-t border-primary-200 py-1">
            <MenuItem icon="person" text="Profile" onClick={() => go(ROUTE_PAGE_PROFILE)} />
            {membersTenancy && <MenuItem icon="group" text="Members" onClick={() => go(ROUTE_PAGE_MEMBERS)} />}
            {canSwitch && <MenuItem icon="tenancy" text="Switch tenancy" onClick={() => go(ROUTE_PAGE_TENANCY_SELECTOR)} />}
            <MenuItem icon="add" text="Request access to a tenancy" onClick={requestAccess} />
            <MenuItem icon="menu_book" text={MANUAL_LINK_LABEL} onClick={() => go(MANUAL_ROUTE)} />
            <MenuItem icon="logout" text="Sign out" onClick={clickSignOut} />
          </div>

          <div className="flex items-center gap-2 border-t border-primary-200 px-4 py-2.5 text-xs text-primary-500">
            <MenuFooterItem text="About" href="/project/about" />
            <span>&middot;</span>
            <MenuFooterItem text="Data Policy" href="/project/data-policy" />
          </div>
        </div>
      )}
      <RequestAccessDialog show={requesting} onClose={() => setRequesting(false)} />
    </div>
  );
}

function Avatar(props: { src: string, onError(e): void, large?: boolean }) {
  const isPlaceholder = props.src === AVATAR_PLACEHOLDER;
  return (
    <img
      className={isPlaceholder ? (props.large ? "w-6 h-6 opacity-70" : "w-[18px] h-[18px] opacity-70") : "w-full h-full object-cover"}
      src={props.src}
      alt="Avatar"
      onError={props.onError}
    />
  );
}

function MenuItem(props: { icon: SymbolCodepoints, text: string, onClick(): void }) {
  return (
    <button
      type="button"
      role="menuitem"
      className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 hover:text-primary-900 whitespace-nowrap"
      onClick={props.onClick}
    >
      <MaterialSymbol icon={props.icon} size={20} weight={400} grade={-25} className="text-primary-500" />
      {props.text}
    </button>
  );
}

function MenuFooterItem(props: { text: string, href: string }) {
  return (
    <Link href={props.href} className="text-xs font-normal text-primary-500 hover:text-primary-900 hover:underline">
      {props.text}
    </Link>
  );
}

export function TenancyBadge(props: { tenancySelected: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-secondary-500 px-2 py-1 font-mono text-[11px] leading-4 text-primary-700 break-all">
      <MaterialSymbol icon="tenancy" size={14} weight={400} grade={-25} className="flex-none text-primary-500" />
      {props.tenancySelected}
    </span>
  );
}
