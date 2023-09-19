"use strict";

const { SECRET_KEY, jwt } = require("../config");
const request = require("supertest");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

let user1Token;
let user2Token;
let messageId;

describe("Messages Routes Test", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });

    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+24155550000",
    });

    let m1 = await Message.create({
      to_username: "test1",
      from_username: "test2",
      body: "this is a message",
    });

    user1Token = jwt.sign({ username: u1.username }, SECRET_KEY);
    user2Token = jwt.sign({ username: u2.username }, SECRET_KEY);
    messageId = m1.id;
  });

  describe("GET /:id", function () {
    test("Gets details of message", async function () {
      let response = await request(app)
        .get(`/messages/${messageId}`)
        .query({ _token: user1Token });

      const message = response.body.message;

      expect(response.status).toEqual(200);
      expect(message.body).toEqual("this is a message");
    });

    test("with wrong token")
  })





});