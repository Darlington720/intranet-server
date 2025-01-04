import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import saveData from "../../utilities/db/saveData.js";
import {
  createApplication,
  getApplicationForms,
  updateApplicationCompletedSections,
} from "../application/resolvers.js";

export const getApplicantQualifications = async ({
  id,
  applicant_id,
  form_no,
  admissions_id,
}) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where += " AND applicant_qualifications.id = ?";
      values.push(id);
    }

    if (applicant_id) {
      where += " AND applicant_qualifications.applicant_id = ?";
      values.push(applicant_id);
    }

    if (admissions_id) {
      where += " AND applicant_qualifications.admissions_id = ?";
      values.push(admissions_id);
    }

    if (form_no) {
      where += " AND applicant_qualifications.form_no = ?";
      values.push(form_no);
    }

    let sql = `SELECT *
      FROM 
      applicant_qualifications
      WHERE applicant_qualifications.deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error.message);
    throw new GraphQLError(
      "Error fetching other applicant qualifications " + error.message,
      {
        extensions: {
          code: "UNAUTHENTICATED",
          http: { status: 501 },
        },
      }
    );
  }
};

export const getEducationInfo = async ({ id }) => {
  try {
    let values = [];
    let where = "";

    if (id) {
      where += " AND id = ?";
      values.push(id);
    }
    let sql = `SELECT * FROM employees_education_info WHERE deleted = 0 ${where}`;

    const [results] = await db.execute(sql, values);
    return results;
  } catch (error) {
    throw new GraphQLError("Error fetching education info", error.message);
  }
};

const educationInfoResolvers = {
  Query: {
    education_info: async () => {
      const result = await getEducationInfo({});
      return result[0];
    },
  },

  Mutation: {
    saveEducationInfo: async (parent, args) => {
      const {
        id,
        employee_id,
        institution,
        award_obtained,
        award_duration,
        grade,
        start_date,
        end_date,
      } = args.payload;

      const data = {
        employee_id,
        institution,
        award_obtained,
        award_duration,
        grade,
        start_date,
        end_date,
      };

      await saveData({
        table: "employees_education_info",
        data,
        id,
      });

      return {
        success: "true",
        message: "Education Information saved successfully",
      };
    },
  },
};

export default educationInfoResolvers;
