import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";

export const getCampuses = async ({ id }) => {
  try {
    let values = [];
    let where = "";

    if (id) {
      where += " AND id = ?";
      values.push(id);
    }

    let sql = `SELECT * FROM campuses WHERE deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching modules");
  }
};

export const getCampus = async ({ id, campus_title }) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where += "AND id = ?";
      values.push(id);
    }

    if (campus_title) {
      where += " AND campus_title LIKE ?";
      values.push("%" + campus_title + "%");
    }

    let sql = `SELECT * FROM campuses WHERE deleted = 0 ${where}`;

    const [results] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching campuses");
  }
};

const campusResolvers = {
  Query: {
    campuses: async () => {
      const result = await getCampuses({});
      return result;
    },
  },
  Campus: {
    added_user: async (parent, args) => {
      try {
        const user_id = parent.added_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    modified_user: async (parent, args) => {
      try {
        const user_id = parent.modified_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
  },
  Mutation: {
    saveCampus: async (parent, args) => {
      const unique_id = generateUniqueID();
      const { id, campus_title, added_by } = args;
      const today = new Date();

      // console.log("the id", id);

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE campuses SET campus_title = ?, modified_by = ?, modified_on = ? WHERE id = ?`;

          let values = [campus_title, added_by, today, id];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No campus with id ${id}`, {
              extensions: {
                // code: '',
                http: { status: 400 },
              },
            });
          }
        } catch (error) {
          // console.log("error", error);
          throw new GraphQLError(error, {
            extensions: {
              // code: '',
              http: { status: 400 },
            },
          });
        }
      } else {
        // create new record
        try {
          let sql = `INSERT INTO campuses(id, campus_title, added_on, added_by) VALUES (?, ?, ?, ?)`;

          let values = [unique_id, campus_title, today, added_by];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert college");
        }
      }

      let sql = `SELECT * FROM campuses WHERE id = ?`;
      let values = [id ? id : unique_id];

      const [results, fields] = await db.execute(sql, values);

      return results[0]; // returning the inserted campus
    },
  },
};

export default campusResolvers;
