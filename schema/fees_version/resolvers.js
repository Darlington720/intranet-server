import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";

const getFeesVersions = async () => {
  try {
    let sql = `SELECT * FROM fees_versions WHERE deleted = 0 ORDER BY id DESC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching fees versions");
  }
};

const feesVersionResolvers = {
  Query: {
    fees_versions: async () => {
      const result = await getFeesVersions();
      return result;
    },
  },
  FeesVersion: {
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
    saveFeesVersion: async (parent, args) => {
      const { id, version_title, version_description, added_by } = args;
      const today = new Date();
      let data = null;
      try {
        // check for the id, if present, we update otherwise we create a new record
        if (id) {
          // update
          data = {
            version_title,
            version_description,
            modified_by: added_by,
            modified_on: today,
          };
        } else {
          // create new record
          data = {
            version_title,
            version_description,
            added_by: added_by,
            added_on: today,
          };
        }

        await saveData({
          table: "fees_versions",
          data,
          id,
        });

        return {
          success: "true",
          message: "Fees Version Saved Succesfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    deleteFeesVersion: async (parent, args) => {
      const { version_id } = args;

      // console.log("the version", version_id);

      try {
        await softDelete({
          table: "fees_versions",
          id: version_id,
        });

        return {
          success: "true",
          message: "Fees Version deleted Succesfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default feesVersionResolvers;
