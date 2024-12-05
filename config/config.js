import knex from "knex";
import mysql from "mysql2/promise";
import { Connector } from "@google-cloud/cloud-sql-connector";

// const connector = new Connector();
// const clientOpts = await connector.getOptions({
//   instanceConnectionName: "instant-river-433416-i7:europe-west2:intranet",
//   ipType: "PUBLIC",
// });

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
// const db = await mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   database: "intranet",
// });

let db;

// async function connectToDatabase() {
//   if (!db || db.state === "disconnected") {
//     db = await mysql.createConnection({
//       host: "localhost",
//       user: "root",
//       database: "intranet",
//       password: "198563",
//     });
//   }
// }

// await connectToDatabase();

const pool = await mysql.createPool({
  host: "localhost",
  user: "root",
  database: "intranet",
});
db = await pool.getConnection();

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
