import request from "request-promise";
export const google = (accessToken: string) =>
  request({
    uri: "https://www.googleapis.com/oauth2/v2/userinfo",
    json: true,
    qs: {
      access_token: accessToken,
    },
  }).then(({ id, name, email, picture }) => ({
    picture: picture,
    id,
    name,
    emails: [{ value: email }],
    provider: "google",
  }));
