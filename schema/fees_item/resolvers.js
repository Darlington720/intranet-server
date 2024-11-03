import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";
import { getTuitionFees } from "../tuition_fees/resolvers.js";
import { getFunctionalFees } from "../functional_fee/resolvers.js";
import { getOtherFees } from "../other_fee/resolvers.js";

const getFeesItems = async () => {
  try {
    let sql = `SELECT * FROM fees_items WHERE deleted = 0 ORDER BY item_name ASC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching fees items");
  }
};

const feesItemRessolver = {
  Query: {
    fees_items: async () => {
      const result = await getFeesItems();
      return result;
    },
  },
  FeesItem: {
    category: async (parent, args) => {
      try {
        const category_id = parent.category_id;
        let sql = `SELECT * FROM fees_categories WHERE id = ?`;

        let values = [category_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0];
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
  },
  Mutation: {
    saveFeesItem: async (parent, args) => {
      const {
        id,
        item_code,
        item_name,
        item_description,
        mandatory,
        category,
      } = args;

      try {
        // check for the id, if present, we update otherwise we create a new record
        let data = {
          item_name,
          item_code,
          item_description,
          mandatory,
          category_id: category,
        };

        await saveData({
          table: "fees_items",
          data,
          id,
        });

        return {
          success: "true",
          message: "Fees Item Saved Succesfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    deleteFeesItem: async (parent, args) => {
      const { fees_item_id } = args;

      try {
        await softDelete({
          table: "fees_items",
          id: fees_item_id,
        });

        return {
          success: "true",
          message: "Item deleted Succesfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default feesItemRessolver;
