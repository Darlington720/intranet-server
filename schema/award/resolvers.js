import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";

const getAllAwards = async () => {
  try {
    let sql = `SELECT * FROM awards`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching awards");
  }
};

const awardResolvers = {
  Query: {
    awards: async () => {
      const result = await getAllAwards();
      return result;
    },
  },
  Award: {
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
    level: async (parent, args) => {
      try {
        const level_id = parent.level_id;
        let sql = `SELECT * FROM levels WHERE id = ?`;

        let values = [level_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the level
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching level", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
  },
  Mutation: {
    saveAward: async (parent, args) => {
      const unique_id = generateUniqueID();
      const { id, level_id, award_title, added_by } = args;
      const today = new Date();

      // console.log("the id", id);

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE awards SET level_id = ?, award_title = ?, modified_by = ?, modified_on = ? WHERE id = ?`;

          let values = [level_id, award_title, added_by, today, id];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No award with id ${id}`, {
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
          let sql = `INSERT INTO awards(id, level_id, award_title, added_on, added_by) VALUES (?, ?, ?, ?, ?)`;

          let values = [unique_id, level_id, award_title, today, added_by];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert award");
        }
      }

      let sql = `SELECT * FROM awards WHERE id = ?`;
      let values = [id ? id : unique_id];

      const [results, fields] = await db.execute(sql, values);

      return results[0]; // returning the inserted award
    },
  },
};

export default awardResolvers;
