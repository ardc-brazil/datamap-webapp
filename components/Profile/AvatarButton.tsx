import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Router from "next/router";
import { useEffect, useState } from "react";
import { ROUTE_PAGE_PROFILE, ROUTE_PAGE_TENANCY_SELECTOR } from "../../contants/InternalRoutesConstants";
import { ContextMenuButton } from "../ContextMenu/ContextMenuButton";
import { ContextMenuButtonItem } from "../ContextMenu/ContextMenuButtonItem";
import { useTenancyStore } from "../TenancyStore";

export default function AvatarButton(props) {
  const { data: session, status } = useSession();
  const [profileImage, setProfileImage] = useState("/img/avatar-placeholder.svg");
  const tenancySelected = useTenancyStore((state) => state.tenancySelected)

  useEffect(() => {
    if (status == "authenticated") {
      if (session.user.image) {
        setProfileImage(session.user.image)
      }
    }
  }, []);

  function clickSignOut() {
    signOut().then((value) => {
      Router.push("/");
    });
  }


  function onError(currentTarget) {
    setProfileImage("/img/avatar-placeholder.svg");
  }

  return (
    <>
      <ContextMenuButton size={72} >
        {/* <Link href="/app/profile"> */}
        <img
          className="w-8 p-1 rounded-full ring-2 ring-primary-300 dark:ring-primary-500 bg-primary-50"
          src={profileImage}
          alt="Avatar"
          onError={onError}
        />
        {/* </Link> */}
        <div>
          <div className="py-3 cursor-pointer px-2 my-1 flex items-center gap-4" onClick={() => Router.push(ROUTE_PAGE_PROFILE)}>
            <div className="inline-block align-middle  pl-2">
              <img
                className="w-8 p-1 rounded-full ring-2 ring-primary-300 dark:ring-primary-500 bg-primary-50"
                src={profileImage}
                alt="Avatar"
                onError={onError}
              />
            </div>
            <div className="font-light">
              <span className="font-bold">
                {session.user.name}
              </span>
              <br />
              <small className=" font-light">
                {session.user.email}
              </small>
              <br />
              <TenancyBadge tenancySelected={tenancySelected} />
            </div>
          </div>
          <hr />
          <ContextMenuButtonItem
            iconName="tenancy"
            text="Select tenancy"
            onClick={() => Router.push(ROUTE_PAGE_TENANCY_SELECTOR)} />

          <ContextMenuButtonItem
            iconName="logout"
            text="Logout"
            onClick={clickSignOut} />
          <hr />
          <div className="flex items-center justify-start gap-2 py-2 px-4">
            <MenuFooterItem text="About" href="/project/about" />
            &middot;
            <MenuFooterItem text="Data Policy" href="/project/data-policy" />
          </div>
        </div>
      </ContextMenuButton>
    </>
  );
}

function MenuFooterItem(props: { text: string, href: string }) {
  return <Link href={props.href}><small className="font-light underline">
    {props.text}
  </small></Link>;
}

export function TenancyBadge(props: { tenancySelected: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
      {props.tenancySelected}
    </span>
  );
}

