import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";

export const getAccYrs = async ({ title, id }) => {
  try {
    let where = "";
    let values = [];

    if (title) {
      where += " AND acc_yr_title = ?";
      values.push(title);
    }

    if (id) {
      where += " AND id = ?";
      values.push(id);
    }

    let sql = `SELECT * FROM acc_yrs WHERE deleted = 0 ${where} ORDER BY acc_yr_title DESC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching Accademic years");
  }
};

const AccYrResolvers = {
  Query: {
    acc_yrs: async () => {
      const result = await getAccYrs({});
      return result;
    },
  },
  AcademicYear: {
    added_user: async (parent, args) => {
      try {
        const user_id = parent.added_by;

        let sql = `SELECT * FROM employees WHERE id = ?`;

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
    saveAccYr: async (parent, args) => {
      const unique_id = generateUniqueID();
      const { id, acc_yr_title, added_by } = args;
      const today = new Date();

      // console.log("the id", id);

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE acc_yrs SET acc_yr_title = ?, modified_by = ?, modified_on = ? WHERE id = ?`;

          let values = [acc_yr_title, added_by, today, id];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No accademic year with id ${id}`, {
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
          let sql = `INSERT INTO acc_yrs(id, acc_yr_title, added_on, added_by) VALUES (?, ?, ?, ?)`;

          let values = [unique_id, acc_yr_title, today, added_by];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert Accademic year");
        }
      }

      let sql = `SELECT * FROM acc_yrs WHERE id = ?`;
      let values = [id ? id : unique_id];

      const [results, fields] = await db.execute(sql, values);

      return results[0]; // returning the inserted acc yr
    },
  },
};

export default AccYrResolvers;
