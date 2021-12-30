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
  session["sid"] = {};

  res.redirect(
    `http://localhost:${process.env.OAUTH_SERVER_PORT}/oauth/authorize?client_id=${query.client_id}&redirect_uri=${query.redirect_uri}&login=${query.login}&scope=${query.scope}&state=${query.state}&allow_signup=${query.allow_signup}&response_type=code`
  );
});

app.get("/callback", (req, res) => {
  const { code } = req.query;
  const { sid } = req.cookies;

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
      const { access_token, scope, token_type, refresh_token } = _res.data;

      session[sid] = { access_token, refresh_token };

      return axios.get(
        `http://localhost:${process.env.RESOURCE_SERVER_PORT}/${scope}`,
        {
          headers: { Authorization: `token ${access_token}` },
        }
      );
    })
    .then(({ data: userInfo }) => {
      res.redirect(`/home?userInfo=${userInfo}`);
    })
    .catch(() => {
      if (session[sid].refresh_token) {
        axios
          .post(`http://localhost:${process.env.OAUTH_SERVER_PORT}/refresh`, {
            grant_type: "refresh_token",
            refresh_token: session[sid].refresh_token,
            scope: "user",
          })
          .then(({ data }) => {
            const { access_token, refresh_token } = data;

            session[sid] = { access_token, refresh_token };

            // and request resource...

            res.redirect(`/home`);
          });

        return;
      }

      res.redirect(`/home`);
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
