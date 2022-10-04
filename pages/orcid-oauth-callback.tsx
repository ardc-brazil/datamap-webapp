import React from "react";
import axios from "axios";
import qs from "qs";

export default function orcidOauthCallback(props) {
  console.log("======");
  console.log(props);
  return <div>orcidOauthCallback</div>;
}

export async function getServerSideProps(context) {
  const authCode = context.query.code;
  const clientId = process.env.OAUTH_ORCID_CLIENT_ID;
  const clientSecret = process.env.OAUTH_ORCID_CLIENT_SECRET;
  const redirectUriBase = process.env.OAUTH_ORCID_REDIRECT_URI_BASE;

  // const data = {
  //   client_id: clientId,
  //   client_secret: clientSecret,
  //   grant_type: "authorization_code",
  //   code: authCode,
  //   redirect_uri: `${redirectUriBase}&code=${authCode}`,
  // };

  const data = `client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${authCode}&redirect_uri=${redirectUriBase}&code=${authCode}`;

  // const resp = await axios.post(
  //   "https://orcid.org/oauth/token",
  //   // qs.stringify(data),
  //   data,
  //   {
  //     headers: { "content-type": "application/x-www-form-urlencoded" },
  //   }
  // );

  return {
    props: { resp }, // will be passed to the page component as props
  };
}
