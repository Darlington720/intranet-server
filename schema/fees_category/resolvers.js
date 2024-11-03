import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";

const getFeesCategories = async () => {
  try {
    let sql = `SELECT * FROM fees_categories WHERE deleted = 0 ORDER BY category_name ASC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching fees categories");
  }
};

const awardResolvers = {
  Query: {
    fees_categories: async () => {
      const result = await getFeesCategories();
      return result;
    },
  },
  FeesCategory: {
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
    saveFeesCategory: async (parent, args) => {
      const unique_id = generateUniqueID();
      const { id, category, added_by } = args;
      const today = new Date();
      let data = null;
      try {
        // check for the id, if present, we update otherwise we create a new record
        if (id) {
          // update
          data = {
            category_name: category,
            modified_by: added_by,
            modified_on: today,
          };
        } else {
          // create new record
          data = {
            category_name: category,
            added_by: added_by,
            added_on: today,
          };
        }

        await saveData({
          table: "fees_categories",
          data,
          id,
        });

        return {
          success: "true",
          message: "Category Saved Succesfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    deleteFeesCategory: async (parent, args) => {
      const { category_id } = args;

      try {
        await softDelete({
          table: "fees_categories",
          id: category_id,
        });

        return {
          success: "true",
          message: "Category deleted Succesfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default awardResolvers;
