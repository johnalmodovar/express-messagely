"use strict";

const { UnauthorizedError } = require("../expressError");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const Message = require("../models/message");
const User = require("../models/user");

const Router = require("express").Router;
const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id",
  ensureLoggedIn,
  async function (req, res) {

    const messageId = req.params.id;
    const username = res.locals.user.username;
    const message = await Message.get(messageId);
    // message.from_user && message.to_user

    if (message.from_user.username === username || message.to_user.username) {
      return res.json({ message });
    } else {
      throw new UnauthorizedError();
    }

  }
);

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/",
  ensureLoggedIn,
  async function (req, res) {
    const from_username = res.locals.user.username;
    const { to_username, body } = req.body;

    const message = await Message.create({ from_username, to_username, body });
    return res.json({ message });
  }
);

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read",
  ensureLoggedIn,
  async function (req, res) {

    const messageId = req.params.id;
    const username = res.locals.user.username;

    const message = await Message.get(messageId);

    if (message.to_user.username === username) {
      readMessage = await Message.markRead(messageId);
      return res.json({ message: readMessage });
    }

  }
);

module.exports = router;