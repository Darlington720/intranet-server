import { GraphQLError } from "graphql";
import { tredumoDB, db, database } from "../../config/config.js";
import generateUniqueID from "../../utilities/generateUniqueID.js";

const getAllSchemes = async () => {
  try {
    let sql = `SELECT * FROM schemes WHERE deleted = 0 ORDER BY scheme_title ASC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching schemes", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const getActiveSchemes = async () => {
  try {
    let sql = `SELECT * FROM schemes WHERE deleted = 0 AND is_active = 1 ORDER BY scheme_title ASC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching schemes", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const schemeResolvers = {
  Query: {
    schemes: async () => {
      const result = await getAllSchemes();
      return result;
    },
    active_schemes: async () => {
      const result = await getActiveSchemes();
      return result;
    },
  },
  Scheme: {
    created_user: async (parent, args) => {
      try {
        const user_id = parent.created_by;
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
    saveScheme: async (parent, args) => {
      const { id, scheme_title, description, is_active, added_by } = args;
      // we need the current date
      const today = new Date();
      const uniqueID = generateUniqueID();
      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE schemes SET scheme_title = ?, description = ?, is_active = ?, modified_by = ?, modified_on = ? WHERE id = ?`;

          let values = [
            scheme_title,
            description,
            is_active,
            added_by,
            today,
            id,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No scheme with id ${id}`, {
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
          let sql = `INSERT INTO schemes(id, scheme_title, description, is_active, created_by, created_on) VALUES (?, ?, ?, ?, ?, ?)`;

          let values = [
            uniqueID,
            scheme_title,
            description,
            is_active,
            added_by,
            today,
          ];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert scheme");
        }
      }

      return {
        success: "true",
        message: "Scheme created successfully",
      };
    },
    deleteScheme: async (parent, args) => {
      try {
        const { scheme_id } = args;

        let sql = `UPDATE schemes SET deleted = 1 WHERE id = ?`;

        let values = [scheme_id];

        const [results, fields] = await db.execute(sql, values);

        // console.log("the results", results);
        if (results.affectedRows == 0 || results.changedRows == 0) {
          // no record the provided id
          throw new GraphQLError(`No scheme with id ${scheme_id}`, {
            extensions: {
              // code: '',
              http: { status: 400 },
            },
          });
        }

        return {
          success: "true",
          message: "Scheme deleted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error);
      }
    },
  },
};

export default schemeResolvers;
