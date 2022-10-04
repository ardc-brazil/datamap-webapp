import React from "react";
import axios from "axios";
import { setUser } from "../lib/user";

export default function orcidOauthCallback(props) {
  console.log("auth-data");
  console.log(props.data);

  return (
    <div>
      <p>Erro to authenticate:</p>
      <pre>{JSON.stringify(props.data, null, 2)}</pre>
    </div>
  );
}

export async function getServerSideProps({ req, res, query }) {
  const authCode = query.code;
  const clientId = process.env.OAUTH_ORCID_CLIENT_ID;
  const clientSecret = process.env.OAUTH_ORCID_CLIENT_SECRET;
  const redirectUriBase = process.env.OAUTH_ORCID_REDIRECT_URI_BASE;

  async function getToken() {
    try {
      const requestData = `client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${authCode}&redirect_uri=${redirectUriBase}&code=${authCode}`;

      const response = await axios.post(
        "https://orcid.org/oauth/token",
        requestData,
        {
          headers: { "content-type": "application/x-www-form-urlencoded" },
        }
      );

      return response.data;
    } catch (error) {
      return error.response.data;
    }
  }

  const data = await getToken();
  const { name, orcid } = data;

  setUser({ name, orcid }, req, res);

  return {
    redirect: {
      permanent: false,
      destination: "/profile",
    },
    props: { data }, // will be passed to the page component as props
  };
}
