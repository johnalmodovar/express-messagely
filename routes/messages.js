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
    //TODO: refactor: message.get does a lot of this checking for us,
    //pseudo code:
    //get message
    //check message.fromUser and messageToUser, if logged in is not included,
    //throw unauthorized

    const messageId = req.params.id;
    const username = res.locals.user.username;
    const messagesTo = await User.messagesTo(username);
    const messagesFrom = await User.messagesFrom(username);
    const allMessages = messagesTo.concat(messagesFrom);

    const matchingMessage = allMessages.filter(message => {
      return (message.id === messageId);
    });

    let message;
    if (matchingMessage) {
      message = await Message.get(messageId);
      return res.json({ message });
    } else {
      throw new UnauthorizedError;
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
    //TODO: Refactor: message.get can similarly help us out here.

    const messageId = req.params.id;
    const username = res.locals.user.username;

    const messages = await User.messagesTo(username);

    const matchingMessage = messages.filter(message => {
      return (message.id === messageId);
    });

    let message;
    if (matchingMessage) {
      message = await Message.markRead(messageId);
      return res.json({ message });
    } else {
      throw new UnauthorizedError();
    }
  }
);

module.exports = router;