"use strict";

/** User of the site. */

const bcrypt = require("bcrypt");
const { DB_URI, SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  //FIXME: register needs to set last_login as well.
  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const join_at = new Date(); //This solved it: easy enough.
    const results = await db.query(
      `INSERT INTO users (username,
                          password,
                          first_name,
                          last_name,
                          phone,
                          join_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone, join_at]
    );

    const user = results.rows[0];

    return user;
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1`,
        [username]
    );

   return await bcrypt.compare(password, results.rows[0].password);
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    let mostRecentLogin = new Date();//payload.iat;

    const results = await db.query(
      `UPDATE users
      SET last_login_at=$1
      WHERE username = $2`,
      [mostRecentLogin, username]
    );
    return {username, last_login: mostRecentLogin};
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username,
          first_name,
          last_name,
        FROM users
        ORDER BY last_name, first_name`
    );

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );
    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(`
    SELECT id, body, sent_at, read_at,
      users.username AS username,
      users.first_name AS first_name,
      users.last_name AS last_name,
      users.phone AS phone,
    FROM messages as m
      JOIN users ON messages.to_username = users.username
    WHERE from_username = $1`,
    [username]);

    return results.rows.map(result => {
      let formatted = {id, body, sent_at, read_at};
      formatted["to_user"] = {username, first_name, last_name, phone};
      return formatted;
    });
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(`
    SELECT id, body, sent_at, read_at,
      users.username AS username,
      users.first_name AS first_name,
      users.last_name AS last_name,
      users.phone AS phone,
    FROM messages as m
      JOIN users ON messages.from_username = users.username
    WHERE from_username = $1`,
    [username]);

    return results.rows.map(result => {
      let formatted = {id, body, sent_at, read_at};
      formatted["from_user"] = {username, first_name, last_name, phone};
      return formatted;
    });
  }
}


module.exports = User;
