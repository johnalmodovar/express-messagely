"use strict";

/** User of the site. */

const bcrypt = require("bcrypt");
const { DB_URI, SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const {NotFoundError, UnauthorizedError } = require("../expressError");

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const results = await db.query(
      `INSERT INTO users (username,
                          password,
                          first_name,
                          last_name,
                          phone,
                          join_at,
                          last_login_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone]
    );
    const user = results.rows[0];

    return user;
  }

  /** Authenticate: is username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT username, password
        FROM users
        WHERE username = $1`,
        [username]
    );
    const user = results.rows[0];
    if (!user) {
      throw new UnauthorizedError();
    }

   return (await bcrypt.compare(password, user.password) === true);
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {

    const results = await db.query(
      `UPDATE users
      SET last_login_at=CURRENT_TIMESTAMP
      WHERE username = $1
      RETURNING username, last_login_at`,
      [username]
    );
    const user = results.rows[0];
    if (!user) {
      throw new NotFoundError;
    }

    return user;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const results = await db.query(
      `SELECT username,
          first_name,
          last_name
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
    const user = results.rows[0];
    if (!user) {
      throw new NotFoundError;
    }
    return user;
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
      users.phone AS phone
    FROM messages as m
      JOIN users ON m.to_username = users.username
    WHERE from_username = $1`,
    [username]);

    return results.rows.map(({
      id,
      body,
      sent_at,
      read_at,
      username,
      first_name,
      last_name,
      phone
    }) => {
        let message = {id, body, sent_at, read_at};
        message["to_user"] = {username, first_name, last_name, phone};
        return message;
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
      users.phone AS phone
    FROM messages as m
      JOIN users ON m.to_username = $1
    WHERE from_username = users.username`,
    [username]);

    return results.rows.map(({
      id,
      body,
      sent_at,
      read_at,
      username,
      first_name,
      last_name,
      phone
    }) => {
      let message = {id, body, sent_at, read_at};
      message["from_user"] = {username, first_name, last_name, phone};
      return message;
    });
  }
}


module.exports = User;
