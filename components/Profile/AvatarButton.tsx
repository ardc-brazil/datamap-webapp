import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function AvatarButton() {
  const { data: session, status } = useSession();
  const [profileImage, setProfileImage] = useState("/img/avatar-placeholder.svg");

  useEffect(() => {
    if (status == "authenticated") {
      if (session.user.image) {
        setProfileImage(session.user.image)
      }
    }
  }, []);


  function onError(currentTarget) {
    setProfileImage("/img/avatar-placeholder.svg");
  }

  return (
    <Link href="/app/profile">
      <img
        className="w-8 h-8 p-1 rounded-full ring-2 ring-primary-300 dark:ring-primary-500 bg-primary-50"
        src={profileImage}
        alt="Avatar"
        onError={onError}
      />
    </Link>
  );
}
