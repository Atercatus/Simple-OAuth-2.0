const express = require("express");
const path = require("path");
const qs = require("querystring");
const app = express();
require("dotenv").config();

const session = {};
const accounts = ["cattus.nets@kakaocorp.com"];
const apps = {};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/init", (req, res) => {
  apps[req.body.client_id] = { ...req.body };

  res.send("register complete");
});

app.post("/login", (req, res) => {
  const { client_id } = req.query;
  const { id, password } = req.body;

  if (accounts.findIndex((e) => e === id) < 0) {
    // 계정 없음
    if (session[client_id].allow_signup === "true") {
      res.redirect("/sign-up");

      return;
    }

    res.status(500).send("error");

    return;
  }

  // if id or password is invalid
  // res.status(401).send("INVALID USER");

  const code = "SplxlOBeZQQYbYS6WxSbIA";

  const { redirect_uri } = session[client_id];
  session[client_id].code = code;
  const state = apps[client_id].state;

  const uri = `${redirect_uri}?code=${code}&state=${state}`;
  res.header("Location", uri);
  res.redirect(uri);
});

app.get("/oauth/authorize", (req, res) => {
  const { client_id, redirect_uri, scope, state, allow_signup } = req.query;

  if (!apps[client_id]) {
    res.status(404).send("APPLICATION IS NOT FOUND");

    return;
  }

  // scope 에 맞게 code 만들어서 보내주기
  // 이후 scope 에 맞는 access_token 발급 시에 사용

  session[client_id] = { ...req.query };

  res.redirect(
    `http://localhost:${process.env.OAUTH_SERVER_PORT}/login_page?client_id=${client_id}`
  );
});

app.get("/login_page", (req, res) => {
  res.sendFile(path.resolve(__dirname, "./login.html"));
});

app.post("/oauth/access_token", (req, res) => {
  const { client_id, client_secret, code, redirect_uri } = req.body;

  const appInfo = apps[client_id];
  const sessionInfo = session[client_id];

  if (sessionInfo.code !== code) {
    res.status(401).send("INVALID CODE");

    return;
  }

  if (
    appInfo.client_secret !== client_secret ||
    (sessionInfo.redirect_uri !== redirect_uri &&
      appInfo.redirect_uri !== redirect_uri)
  ) {
    res.status(401).send("INVALID REQUEST");

    return;
  }

  const access_token = "gho_16C7e42F292c6912E7710c838347Ae178B4a";
  const scope = appInfo.scope ?? "user"; // default: user
  const token_type = "bearer";

  res.send({ access_token, scope, token_type });
});

app.listen(process.env.OAUTH_SERVER_PORT, () => {
  console.log(`listening on ${process.env.OAUTH_SERVER_PORT}`);
});
