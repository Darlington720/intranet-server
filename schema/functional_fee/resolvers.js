import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";

export const getFunctionalFees = async ({
  acc_yr_id,
  campus_id,
  intake_id,
  level_id,
  nationality_category_id,
  study_time_id,
}) => {
  try {
    let where = "";
    let values = [];

    if (acc_yr_id) {
      where += " AND functional_fees.acc_yr_id = ?";
      values.push(acc_yr_id);
    }

    if (campus_id) {
      where += " AND functional_fees.campus_id = ?";
      values.push(campus_id);
    }

    if (intake_id) {
      where += " AND functional_fees.intake_id = ?";
      values.push(intake_id);
    }

    if (level_id) {
      where += " AND functional_fees.level_id = ?";
      values.push(level_id);
    }

    if (nationality_category_id) {
      where += " AND functional_fees.nationality_category_id = ?";
      values.push(nationality_category_id);
    }

    if (study_time_id) {
      where += " AND functional_fees.study_time_id = ?";
      values.push(study_time_id);
    }

    let sql = `SELECT 
    functional_fees.*,
    fees_items.item_code,
    fees_items.item_name,
    fees_items.mandatory,
    fees_items.item_description, 
    fees_items.category_id 
    FROM functional_fees 
    LEFT JOIN fees_items ON functional_fees.item_id = fees_items.id
    WHERE functional_fees.deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching functional fees");
  }
};

const TuitionFeeResolvers = {
  Query: {
    functional_fees: async (parent, args) => {
      try {
        const {
          acc_yr_id,
          campus_id,
          intake_id,
          level_id,
          nationality_category_id,
          study_time_id,
        } = args;

        const results = await getFunctionalFees({
          acc_yr_id,
          campus_id,
          intake_id,
          level_id,
          nationality_category_id,
          study_time_id,
        });

        return results;
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError("Error fetching functional Fees");
      }
    },
  },
  FunctionalFee: {
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
    frequency: async (parent, args) => {
      try {
        let frequency_code = parent.frequency_code;
        let sql = `SELECT * FROM frequency_codes WHERE code_id = ?`;
        let values = [frequency_code];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results.length);
        return results[0]; // expecting one or more schools from a single college
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError("Error fetching frequency code");
      }
    },
  },
  Mutation: {
    saveFunctionalFee: async (parent, args) => {
      const today = new Date();
      const {
        id,
        acc_yr_id,
        campus_id,
        intake_id,
        level_id,
        nationality_category_id,
        study_time_id,
        item_id,
        amount,
        frequency_code,
        added_by,
      } = args;

      const data = {
        acc_yr_id,
        campus_id,
        intake_id,
        level_id,
        nationality_category_id,
        study_time_id,
        item_id,
        amount,
        frequency_code,
        added_by,
        added_on: today,
      };

      await saveData({
        table: "functional_fees",
        id,
        data,
      });

      return {
        success: "true",
        message: "Fee Item Saved Successfully",
      };
    },
    deleteFuntionalFee: async (parent, args) => {
      const { functional_fee_id } = args;

      await softDelete({
        table: "functional_fees",
        id: functional_fee_id,
      });

      return {
        success: "true",
        message: "Functional Fee deleted Successfully",
      };
    },
  },
};

export default TuitionFeeResolvers;
