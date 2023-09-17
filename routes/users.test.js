"use strict";

const { SECRET_KEY, jwt } = require("../config");
const request = require("supertest");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");

let user1Token;
let user2Token;

describe("Users Routes Test", function () {

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

    user1Token = jwt.sign({ username: u1.username }, SECRET_KEY);
    user2Token = jwt.sign({ username: u2.username }, SECRET_KEY);
  });

  /** GET /users => {...} */

  describe("GET /users", function () {
    test("grabs all users list w/ right token", async function () {
      let response = await request(app)
        .get("/users")
        .query({ _token: user1Token });

      expect(response.body).toEqual({
        users: [{
          username: "test1",
          first_name: "Test1",
          last_name: "Testy1"},
          {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2"}
        ]});
    });

    test("what happens with bad token", async function () {
      let response = await request(app)
        .get("/users")
        .query({ _token: "bad token" });

      expect(response.status).toEqual(401);
    });

    test("what happens with no token", async function () {
      let response = await request(app)
        .get("/users")

      expect(response.status).toEqual(401);
    });

  });

//  /** GET /:username */

  describe("GET /:username", function () {
    test ("get a single user's details", async function () {
      let response = await request(app)
        .get("/users/test1")
        .query({ _token: user1Token });

      const user = response.body.user;
      expect(response.status).toEqual(200);
      expect(user.first_name).toEqual("Test1");
      expect(user.phone).toEqual("+14155550000");
    });
  });



});

afterAll(async function () {
  await db.end();
});