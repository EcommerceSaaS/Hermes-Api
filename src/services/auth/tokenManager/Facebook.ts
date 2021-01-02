import request from "request-promise";

export const facebook = (accessToken: string) =>
  request({
    uri: "https://graph.facebook.com/me",
    json: true,
    qs: {
      access_token: accessToken,
      fields: "id, name, email, picture.type(large)",
    },
  }).then(({ id, name, email, picture }) => ({
    picture: picture.data.url,
    id,
    name,
    emails: [{ value: email }],
    provider: "facebook",
  }));
