const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const axios = require("axios");
const app = express();
require("dotenv").config();

app.use(cookieParser());

const session = {};

// Authorization Request (client => resource owner)
app.get("/login", (req, res) => {
  const query = {
    client_id: "CLIENT_ID",
    redirect_uri: "http://localhost:10000/callback",
    // login: "fjqm941025", // Suggests a specific account to use for signing in and authorizing the app.
    scope: "user", // user, repo, ...
    state: "RANDOM_STRING",
    allow_signup: "true",
  };

  res.cookie("sid", "SID");

  res.redirect(
    `http://localhost:${process.env.OAUTH_SERVER_PORT}/oauth/authorize?client_id=${query.client_id}&redirect_uri=${query.redirect_uri}&login=${query.login}&scope=${query.scope}&state=${query.state}&allow_signup=${query.allow_signup}&response_type=code`
  );
});

app.get("/callback", (req, res) => {
  const { code } = req.query;

  axios
    .post(
      `http://localhost:${process.env.OAUTH_SERVER_PORT}/oauth/access_token`,
      {
        client_id: "CLIENT_ID",
        client_secret: "CLIENT_SECRET",
        code,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:10000/callback",
      }
    )
    .then((_res) => {
      const { access_token, scope, token_type } = _res.data;

      const { sid } = req.cookies;
      session[sid] = { access_token };

      return axios.get(
        `http://localhost:${process.env.RESOURCE_SERVER_PORT}/${scope}`,
        {
          headers: { Authorization: `token ${access_token}` },
        }
      );
    })
    .then(({ data: userInfo }) => {
      res.redirect(`/home?userInfo=${userInfo}`);
    });
});

app.get("/home", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./client.html"));
});

app.listen(process.env.CLIENT_PORT, () => {
  setTimeout(() => {
    axios
      .post(`http://localhost:${process.env.OAUTH_SERVER_PORT}/init`, {
        client_id: "CLIENT_ID",
        client_secret: "CLIENT_SECRET",
        redirect_uri: "http://localhost:10000/callback",
        application_name: "my app",
        homepage_uri: "http://localhost:10000/home",
      })
      .then((res) => console.log(res.data));
  }, 1000);

  console.log(`listening on ${process.env.CLIENT_PORT}`);
});
