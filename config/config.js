import knex from "knex";
import mysql from "mysql2/promise";

const baseUrl = "http://localhost:2222/module_logos/";
const port = 2323;
const host = "0.0.0.0";
const PRIVATE_KEY = "tredumo#123";

const database = knex({
  client: "mysql",
  connection: {
    host: "localhost",
    user: "root",
    password: "",
    database: "admissions",
  },
});

const tredumoDB = knex({
  client: "mysql",
  connection: {
    host: "localhost",
    user: "root",
    password: "",
    database: "nkumba",
  },
});

const postgraduateDB = knex({
  client: "mysql",
  connection: {
    host: "localhost",
    user: "root",
    password: "root",
    database: "postgrad_db",
    port: 8889,
  },
});

// Create the connection to database
const _db = knex({
  client: "mysql",
  connection: {
    host: "localhost",
    user: "root",
    password: "",
    database: "intranet",
  },
});

// Create the connection to database
const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "intranet",
});

// console.log("database", db);

export {
  baseUrl,
  port,
  database,
  tredumoDB,
  _db,
  postgraduateDB,
  db,
  host,
  PRIVATE_KEY,
};
