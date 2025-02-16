import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import {
  createApplication,
  getApplicationForms,
  updateApplicationCompletedSections,
} from "../application/resolvers.js";
import { getUnebSubjects } from "../uneb_subjects/resolvers.js";
import { getUnebCentres } from "../uneb_center/resolvers.js";
import { checkApplicantData } from "../applicant/resolvers.js";

export const getUnebResultsSummary = async ({
  id,
  applicant_id,
  form_no,
  admissions_id,
  uneb_study_level_id,
}) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where += " AND uneb_results_summary.id = ?";
      values.push(id);
    }

    if (applicant_id) {
      where += " AND uneb_results_summary.applicant_id = ?";
      values.push(applicant_id);
    }

    if (admissions_id) {
      where += " AND uneb_results_summary.admissions_id = ?";
      values.push(admissions_id);
    }

    if (form_no) {
      where += " AND uneb_results_summary.form_no = ?";
      values.push(form_no);
    }

    if (uneb_study_level_id) {
      where += " AND uneb_results_summary.uneb_study_level_id = ?";
      values.push(uneb_study_level_id);
    }

    let sql = `SELECT *
      FROM 
      uneb_results_summary
      WHERE uneb_results_summary.deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error.message);
    throw new GraphQLError("Error fetching Uneb Results " + error.message, {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const getUnebResults = async ({
  id,
  uneb_results_summary_id,
  subject_code,
}) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where += " AND uneb_results_details.id = ?";
      values.push(id);
    }

    if (uneb_results_summary_id) {
      where += " AND uneb_results_details.uneb_results_summary_id = ?";
      values.push(uneb_results_summary_id);
    }

    if (subject_code) {
      where += " AND uneb_results_details.subject_code = ?";
      values.push(subject_code);
    }

    let sql = `SELECT *
      FROM 
      uneb_results_details
      WHERE uneb_results_details.deleted = 0 ${where} ORDER BY id ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error.message);
    throw new GraphQLError("Error fetching Uneb Results " + error.message, {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const saveUnebResultsSummary = async ({ id, data }) => {
  try {
    if (id) {
      // update
      // update
      let sql2 = `UPDATE uneb_results_summary SET 
             applicant_id = ?,
             form_no = ?,
             admissions_id = ?,
             school_id = ?,
             index_no = ?,
             year_of_sitting = ?,
             total_distinctions = ?,
             total_credits = ?,
             total_passes = ?,
             uneb_study_level_id = ?
             WHERE id = ?`;

      let values2 = [
        data.applicant_id,
        data.form_no,
        data.admissions_id,
        data.school_id,
        data.index_no,
        data.year_of_sitting,
        data.total_distinctions,
        data.total_credits,
        data.total_passes,
        data.uneb_study_level_id,
        id,
      ];

      const [results2, fields2] = await db.execute(sql2, values2);
    } else {
      // lets now insert the program choices in the database
      let sql = `INSERT INTO uneb_results_summary(
       applicant_id,
       form_no,
       admissions_id,
       school_id,
       index_no,
       year_of_sitting,
       total_distinctions,
       total_credits,
       total_passes,
       uneb_study_level_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      let values = [
        data.applicant_id,
        data.form_no,
        data.admissions_id,
        data.school_id,
        data.index_no,
        data.year_of_sitting,
        data.total_distinctions,
        data.total_credits,
        data.total_passes,
        data.uneb_study_level_id,
      ];

      const [results, fields] = await db.execute(sql, values);
    }
  } catch (error) {
    throw new GraphQLError(error.message);
  }
};

const unebResultsSummaryResolvers = {
  Query: {
    university_details: async () => {
      const result = await getUniversityDetails();
      return result[0];
    },
  },
  UnebResultsSummary: {
    uneb_results: async (parent, args) => {
      try {
        const results = await getUnebResults({
          uneb_results_summary_id: parent.id,
        });
        return results;
      } catch (error) {
        throw GraphQLError(error.message);
      }
    },
    school: async (parent, args) => {
      try {
        const result = await getUnebCentres({
          id: parent.school_id,
        });
        return result[0];
      } catch (error) {
        throw GraphQLError(error.message);
      }
    },
  },
  UnebResult: {
    subject: async (parent, args) => {
      try {
        const result = await getUnebSubjects({
          uneb_subject_code: parent.subject_code,
        });
        return result[0];
      } catch (error) {
        throw GraphQLError(error.message);
      }
    },
  },
  Mutation: {
    saveUnebResults: async (parent, args, context) => {
      const applicant_id = context.req.user.applicant_id;
      const {
        did_exams,
        school_id,
        index_no,
        year_of_sitting,
        total_distinctions,
        total_credits,
        total_passes,
        uneb_study_level_id,
        form_no,
        admissions_id,
        uneb_results,
        remove_ids,
      } = args;

      try {
        const applicantData = await checkApplicantData(applicant_id, args);

        let data = null;

        if (uneb_study_level_id == "1") {
          // olevel
          data = {
            did_exams,
            applicant_id,
            form_no,
            admissions_id,
            school_id,
            index_no,
            year_of_sitting,
            total_distinctions,
            total_credits,
            total_passes,
            uneb_study_level_id,
            completed: true,
          };
        } else {
          data = {
            did_exams,
            applicant_id,
            form_no,
            admissions_id,
            school_id,
            index_no,
            year_of_sitting,
            uneb_study_level_id,
            completed: true,
          };
        }

        let existingUnebResult = await getUnebResultsSummary({
          applicant_id,
          form_no: applicantData.form_no,
          uneb_study_level_id, // O or A level
        });

        const save_id = await saveData({
          table: "uneb_results_summary",
          id: existingUnebResult[0] ? existingUnebResult[0].id : null,
          data,
        });

        if (did_exams) {
          // console.log("saved", results);

          // now lets work on the actual results
          const idsString = remove_ids.join(","); // Convert array to comma-separated string
          // console.log("ids", idsString);
          if (idsString) {
            const sql = `DELETE FROM uneb_results_details WHERE id IN (${idsString})`;

            // Execute the SQL query
            const [results, fields] = await db.execute(sql);
          }

          // console.log("delete results", results);

          for (const result of uneb_results) {
            const { subject_code, grade } = result;

            const _data = {
              uneb_results_summary_id: save_id,
              subject_code,
              grade,
            };

            const existingResult = await getUnebResults({
              uneb_results_summary_id: save_id,
              subject_code,
            });

            await saveData({
              table: "uneb_results_details",
              id: existingResult[0] ? existingResult[0].id : null,
              data: _data,
            });
          }
        }

        const application = await getApplicationForms({
          running_admissions_id: applicantData.admissions_id,
          applicant_id,
          form_no: applicantData.form_no,
          application_details: true,
        });

        return {
          success: true,
          message: "Applicant Bio Data Saved Successfully",
          result: application[0],
        };
      } catch (error) {
        console.log("error", error.message);
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default unebResultsSummaryResolvers;
