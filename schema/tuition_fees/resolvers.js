import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";

export const getTuitionFees = async ({
  acc_yr_id,
  campus_id,
  intake_id,
  school_id,
  course_id,
  study_yr,
  nationality_category_id,
  study_time_id,
  study_yrs,
}) => {
  try {
    let where = "";
    let values = [];

    if (acc_yr_id) {
      where += " AND tuition_fees.acc_yr_id = ?";
      values.push(acc_yr_id);
    }

    if (campus_id) {
      where += " AND tuition_fees.campus_id = ?";
      values.push(campus_id);
    }

    if (intake_id) {
      where += " AND tuition_fees.intake_id = ?";
      values.push(intake_id);
    }

    if (school_id) {
      where += " AND tuition_fees.school_id = ?";
      values.push(school_id);
    }

    if (course_id) {
      where += " AND tuition_fees.course_id = ?";
      values.push(course_id);
    }

    if (study_yr) {
      where += " AND tuition_fees.study_yr = ?";
      values.push(study_yr);
    }

    if (study_yrs) {
      const placeholders = study_yrs.map(() => "?").join(",");

      // Add the dynamic placeholders to the query
      where += ` AND tuition_fees.study_yr IN (${placeholders})`;

      // Push each study year individually into the values array
      values.push(...study_yrs);
    }

    if (nationality_category_id) {
      where += " AND tuition_fees.nationality_category_id = ?";
      values.push(nationality_category_id);
    }

    if (study_time_id) {
      where += " AND tuition_fees.study_time_id = ?";
      values.push(study_time_id);
    }

    let sql = `SELECT 
    tuition_fees.*,
    fees_items.item_code,
    fees_items.item_name,
    fees_items.mandatory,
    fees_items.item_description,
    fees_items.category_id
    FROM tuition_fees 
    LEFT JOIN fees_items ON tuition_fees.item_id = fees_items.id
    WHERE tuition_fees.deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching tuition fees", error.message);
  }
};

const TuitionFeeResolvers = {
  Query: {
    tuition_fees: async (parent, args) => {
      try {
        const {
          acc_yr_id,
          campus_id,
          intake_id,
          school_id,
          course_id,
          study_yr,
          nationality_category_id,
          study_time_id,
        } = args;

        const results = await getTuitionFees({
          acc_yr_id,
          campus_id,
          intake_id,
          school_id,
          course_id,
          study_yr,
          nationality_category_id,
          study_time_id,
        });

        return results;
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError("Error fetching modules");
      }
    },
  },
  TuitionFee: {
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
    saveTuitionFee: async (parent, args) => {
      const today = new Date();
      const {
        id,
        acc_yr_id,
        campus_id,
        intake_id,
        school_id,
        course_id,
        study_yr,
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
        school_id,
        course_id,
        study_yr,
        nationality_category_id,
        study_time_id,
        item_id,
        amount,
        frequency_code,
        added_by,
        added_on: today,
      };

      await saveData({
        table: "tuition_fees",
        id,
        data,
      });

      return {
        success: "true",
        message: "Fee Item Saved Successfully",
      };
    },
    deleteTuitionFee: async (parent, args) => {
      const { tuition_fee_id } = args;

      await softDelete({
        table: "tuition_fees",
        id: tuition_fee_id,
      });

      return {
        success: "true",
        message: "Tuition Fee deleted Successfully",
      };
    },
  },
};

export default TuitionFeeResolvers;
