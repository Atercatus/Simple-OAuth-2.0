const express = require("express");
const app = express();
require("dotenv").config();

const info = {
  user: "he is developer",
};

app.get("/user", (req, res) => {
  const token = req.header("Authorization");

  if (!isValid(token)) {
    res.status(401).send("INVALID TOKEN");

    return;
  }

  res.send(info.user);
});

app.listen(process.env.RESOURCE_SERVER_PORT, () => {
  console.log(`listening on ${process.env.RESOURCE_SERVER_PORT}`);
});

function isValid(token) {
  // need validation
  return token === "token gho_16C7e42F292c6912E7710c838347Ae178B4a";
}
