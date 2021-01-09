import request from "request-promise";
export const google: (
  accessToken: string
) => Promise<{
  picture: string;
  id: string;
  name: string;
  emails: { value: string }[];
  provider: "google" | "facebook";
}> = (accessToken: string) =>
  request({
    uri: "https://www.googleapis.com/oauth2/v2/userinfo",
    json: true,
    qs: {
      access_token: accessToken,
    },
  }).then(({ id, name, email, picture }) => ({
    picture,
    id,
    name,
    emails: [{ value: email }],
    provider: "google",
  }));
