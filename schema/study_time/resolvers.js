import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";

const getAllStudyTimes = async () => {
  try {
    let sql = `SELECT * FROM study_times ORDER BY study_time_title ASC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching study times");
  }
};

const studyTimeResolvers = {
  Query: {
    study_times: async () => {
      const result = await getAllStudyTimes();
      return result;
    },
  },
  StudyTime: {
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
    saveStudyTime: async (parent, args) => {
      const unique_id = generateUniqueID();
      const { id, study_time_title, added_by } = args;
      const today = new Date();

      // console.log("the id", id);

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE study_times SET study_time_title = ?, modified_by = ?, modified_on = ? WHERE id = ?`;

          let values = [study_time_title, added_by, today, id];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No study time with id ${id}`, {
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
          let sql = `INSERT INTO study_times(id, study_time_title, added_on, added_by) VALUES (?, ?, ?, ?)`;

          let values = [unique_id, study_time_title, today, added_by];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert study time");
        }
      }

      let sql = `SELECT * FROM study_times WHERE id = ?`;
      let values = [id ? id : unique_id];

      const [results, fields] = await db.execute(sql, values);

      return results[0]; // returning the inserted study time
    },
  },
};

export default studyTimeResolvers;
