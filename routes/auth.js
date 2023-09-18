"use strict";

const { SECRET_KEY, jwt } = require("../config");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const Router = require("express").Router;
const router = new Router();

/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res) {
  if (req.body === undefined) throw new BadRequestError();

  const { username, password } = req.body;

  if (await User.authenticate(username, password)){
    const token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  }

  throw new UnauthorizedError("Invalid username/password");
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res) {
  if (res.locals.user) throw new Error("Please log out to continue.");

  const { username, password, first_name, last_name, phone } = req.body;

  const user = await User.register({ username, password, first_name, last_name, phone });
  console.log("What user is", user)
  const token = jwt.sign({ username }, SECRET_KEY);

  return res.json({ token });
})

module.exports = router;