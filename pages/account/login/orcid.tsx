import React from "react";

import OAuth2Login from "react-simple-oauth2-login";

export default function orcidPage() {
  const onSuccess = (response) => console.log(response);
  const onFailure = (response) => console.error(response);

  return (
    <div>
      <OAuth2Login
        authorizationUrl="https://orcid.org/oauth/authorize"
        responseType="token"
        clientId="APP-1RKJOENQPVY476EF"
        redirectUri="https://datamap-webapp.vercel.app/orcid-oauth-callback"
        onSuccess={onSuccess}
        onFailure={onFailure}
      />
    </div>
  );
}
