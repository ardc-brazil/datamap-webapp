import { useSession } from "next-auth/react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function AvatarButton() {
  const { data: session, status } = useSession();
  const [profileImage, setProfileImage] = useState("/img/orcid-logo.svg");

  useEffect(() => {
    if (status == "authenticated") {
      setProfileImage(session.user.image)
    }
  }, []);


  function onError(currentTarget) {
    setProfileImage("/img/orcid-logo.svg");
  }

  return (
    <Link href="/profile">
      <a>
        <img
          className="w-10 h-10 p-1 rounded-full ring-2 ring-primary-300 dark:ring-primary-500 bg-primary-50"
          src={profileImage}
          alt="Avatar"
          onError={onError}
        />
      </a>
    </Link>
  );
}
