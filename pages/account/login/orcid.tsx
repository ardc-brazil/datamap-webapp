import React, { useState } from "react";

import OAuth2Login from "react-simple-oauth2-login";

export default function orcidPage() {
  const appServerUrl = "https://orcid.org";

  const onFailure = (response) => console.error(response);
  const onSuccess = (response) => console.log(response);

  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // You can test this with a GitHub OAuth2 app (provided test server supports GitHub and Spotify)
  // const onSuccess = ({ code }) =>
  //   fetch(`${appServerUrl}/oauth/token`, {
  //     method: "POST",
  //     body: JSON.stringify({ code }),
  //     headers: {
  //       "content-type": "application/json",
  //     },
  //   })
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setAccessToken(data.access_token);
  //       return data.access_token;
  //     })
  //     .then((token) =>
  //       fetch(`${oauthServerUrl}/api/user`, {
  //         method: "GET",
  //         headers: {
  //           accept: "application/json",
  //           authorization: `Bearer ${token}`,
  //         },
  //       })
  //     )
  //     .then((res) => res.json())
  //     .then(setUser)
  //     .catch(setError);

  return (
    <div>
      <OAuth2Login
        authorizationUrl={`${appServerUrl}/oauth/authorize`}
        responseType="code"
        clientId="APP-1RKJOENQPVY476EF"
        scope="/authenticate"
        redirectUri="https://127.0.0.1:3000/orcid-oauth-callback"
        onSuccess={onSuccess}
        onFailure={onFailure}
      />
    </div>
  );
}
