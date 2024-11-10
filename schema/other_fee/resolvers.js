import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
// import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";

export const getOtherFees = async ({
  id,
  acc_yr_id,
  campus_id,
  intake_id,
  nationality_category_id,
  other_fees_ids,
  fee_name,
}) => {
  try {
    let where = "";
    let values = [];

    if (other_fees_ids) {
      if (other_fees_ids.length == 0 || !other_fees_ids) {
        return [];
      }
      const placeholders = other_fees_ids.map(() => "?").join(",");

      // Add the dynamic placeholders to the query
      where += ` AND other_fees.id IN (${placeholders})`;

      // Push each study year individually into the values array
      values.push(...other_fees_ids);
    }

    if (id) {
      where += " AND other_fees.id = ?";
      values.push(id);
    }

    if (fee_name) {
      where += " AND fees_items.item_name = ?";
      values.push(fee_name);
    }

    if (acc_yr_id) {
      where += " AND other_fees.acc_yr_id = ?";
      values.push(acc_yr_id);
    }

    if (campus_id) {
      where += " AND other_fees.campus_id = ?";
      values.push(campus_id);
    }

    if (intake_id) {
      where += " AND other_fees.intake_id = ?";
      values.push(intake_id);
    }

    if (nationality_category_id) {
      where += " AND other_fees.nationality_category_id = ?";
      values.push(nationality_category_id);
    }

    let sql = `SELECT 
    other_fees.*,
    fees_items.item_code,
    fees_items.item_name,
    fees_items.mandatory,
    fees_items.item_description,
    fees_items.category_id 
    FROM other_fees 
    LEFT JOIN fees_items ON other_fees.item_id = fees_items.id
    WHERE other_fees.deleted = 0 ${where} ORDER BY fees_items.item_name ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching other Fees " + error.message);
  }
};

const otherFeeResolvers = {
  Query: {
    other_fees: async (parent, args) => {
      try {
        const { acc_yr_id, campus_id, intake_id, nationality_category_id } =
          args;

        const results = await getOtherFees({
          acc_yr_id,
          campus_id,
          intake_id,
          nationality_category_id,
        });

        return results;
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
  },
  OtherFee: {
    fee_item: async (parent, args) => {
      try {
        let item_id = parent.item_id;
        let sql = `SELECT * FROM fees_items WHERE id = ? AND deleted = 0`;
        let values = [item_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results.length);
        return results[0]; // expecting one or more schools from a single college
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError("Error fetching item");
      }
    },
  },
  Mutation: {
    saveOtherFee: async (parent, args) => {
      const today = new Date();
      const {
        id,
        acc_yr_id,
        campus_id,
        intake_id,
        nationality_category_id,
        item_id,
        amount,
        added_by,
      } = args;

      const data = {
        acc_yr_id,
        campus_id,
        intake_id,
        nationality_category_id,
        item_id,
        amount,
        added_by,
        added_on: today,
      };

      if (!id) {
        // lets first see if the combination already exists
        try {
          let sql =
            "SELECT * FROM other_fees WHERE deleted = 0 AND acc_yr_id = ? AND campus_id = ? AND intake_id = ? AND nationality_category_id = ? AND item_id = ?";
          let values = [
            acc_yr_id,
            campus_id,
            intake_id,
            nationality_category_id,
            item_id,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);

          if (!results[0]) {
            // means the item is new
            await saveData({
              table: "other_fees",
              id: null,
              data,
            });
          } else {
            // means the item is new
            await saveData({
              table: "other_fees",
              id: results[0].id,
              data,
            });
          }
        } catch (error) {
          throw new GraphQLError(error.message);
        }
      } else {
        await saveData({
          table: "other_fees",
          id,
          data,
        });
      }

      return {
        success: "true",
        message: "Fee Item Saved Successfully",
      };
    },
    deleteOtherFee: async (parent, args) => {
      const { other_fee_id } = args;

      await softDelete({
        table: "other_fees",
        id: other_fee_id,
      });

      return {
        success: "true",
        message: "Fee deleted Successfully",
      };
    },
  },
};

export default otherFeeResolvers;
