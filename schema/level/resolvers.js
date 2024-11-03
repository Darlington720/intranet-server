import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";

const getAllLevels = async () => {
  try {
    let sql = `SELECT * FROM levels ORDER BY level_title ASC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching modules");
  }
};

const levelResolvers = {
  Query: {
    levels: async () => {
      const result = await getAllLevels();
      return result;
    },
  },
  Level: {
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
    study_times: async (parent, args) => {
      const study_time_ids = parent.level_study_times;
      let levelIdsArray = [];
      let placeholders = null;
      try {
        if (study_time_ids) {
          // Split the string into an array of individual IDs
          levelIdsArray = study_time_ids.split(",");

          // Dynamically generate placeholders based on the array length
          placeholders = levelIdsArray.map(() => "?").join(",");
        }

        // Build the SQL query with placeholders
        let sql = `SELECT *
        FROM study_times
        WHERE id IN (${placeholders}) ORDER BY study_time_title ASC;`;

        // Execute the query with the array of values
        const [results, fields] = await db.execute(sql, levelIdsArray);
        // console.log("results", results);
        return results;
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
  },
  Mutation: {
    saveLevel: async (parent, args) => {
      const unique_id = generateUniqueID();
      const { id, level_code, level_title, level_study_times, added_by } = args;
      const today = new Date();

      // console.log("=arfgs", args);

      let idsString = "";
      // stringify the levels
      if (level_study_times) {
        idsString = level_study_times.join(",");
      }

      // console.log("level study times", level_study_times);

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update

        try {
          let sql = `UPDATE levels SET level_code = ?, level_title = ?, level_study_times = ?, modified_by = ?, modified_on = ? WHERE id = ?`;

          let values = [
            level_code,
            level_title,
            idsString,
            added_by,
            today,
            id,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
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
          let sql = `INSERT INTO levels(id, level_code, level_title, level_study_times, added_on, added_by) VALUES (?, ?, ?, ?, ?, ?)`;

          let values = [
            unique_id,
            level_code,
            level_title,
            idsString,
            today,
            added_by,
          ];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert level");
        }
      }

      let sql = `SELECT * FROM levels WHERE id = ?`;
      let values = [id ? id : unique_id];

      const [results, fields] = await db.execute(sql, values);

      return results[0]; // returning the inserted level
    },
  },
};

export default levelResolvers;
