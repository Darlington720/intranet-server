import { GraphQLError } from "graphql";
import { tredumoDB, db, database } from "../../config/config.js";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import getRunningAdmissions from "../../utilities/checkSchemeStatus.js";

const getAllAdmissionLevels = async () => {
  try {
    let sql = `SELECT * FROM admission_levels WHERE deleted = 0 ORDER BY admission_level_title DESC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching admission levels", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const admissionLevelResolvers = {
  Query: {
    admission_levels: async () => {
      const result = await getAllAdmissionLevels();
      return result;
    },
  },
  AdmissionLevel: {
    running_admissions: async (parent, args) => {
      try {
        let sql = `SELECT * FROM running_admissions WHERE admission_level_id = ? AND deleted = 0 ORDER BY end_date ASC`;
        let values = [parent.id];

        const [results, fields] = await db.execute(sql, values);

        const runningAdmissions = getRunningAdmissions(results);
        // console.log("results", runningAdmissions);
        return runningAdmissions;
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(
          "Error fetching runing admissions " + error.message,
          {
            extensions: {
              code: "UNAUTHENTICATED",
              http: { status: 501 },
            },
          }
        );
      }
    },
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
    saveAdmissionLevel: async (parent, args) => {
      const {
        id,
        admission_level_title,
        prog_levels,
        admission_level_description,
        added_by,
      } = args;
      // we need the current date
      const today = new Date();
      const uniqueID = generateUniqueID();
      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE admission_levels SET admission_level_title = ?, prog_levels = ?, admission_level_description = ?, modified_by = ?, modified_on = ? WHERE id = ?`;

          let values = [
            admission_level_title,
            prog_levels,
            admission_level_description,
            added_by,
            today,
            id,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No admission level with id ${id}`, {
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
          let sql = `INSERT INTO admission_levels(id, admission_level_title, prog_levels, admission_level_description, created_by, created_on) VALUES (?, ?, ?, ?, ?, ?)`;

          let values = [
            uniqueID,
            admission_level_title,
            prog_levels,
            admission_level_description,
            added_by,
            today,
          ];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert Admission level");
        }
      }

      return {
        success: "true",
        message: "Admission level created successfully",
      };
    },
    deleteAdmissionLevel: async (parent, args) => {
      try {
        const { admission_level_id } = args;

        // console.log("admission level id", admission_level_id);

        let sql = `UPDATE admission_levels SET deleted = 1 WHERE id = ?`;

        let values = [admission_level_id];

        const [results, fields] = await db.execute(sql, values);

        // console.log("the results", results);
        if (results.affectedRows == 0 || results.changedRows == 0) {
          // no record the provided id
          throw new GraphQLError(
            `No admission level with id ${admission_level_id}`,
            {
              extensions: {
                // code: '',
                http: { status: 400 },
              },
            }
          );
        }

        return {
          success: "true",
          message: "Admission level deleted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error);
      }
    },
  },
};

export default admissionLevelResolvers;
