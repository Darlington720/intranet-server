import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import saveData from "../../utilities/db/saveData.js";
import {
  createApplication,
  getApplicationForms,
  updateApplicationCompletedSections,
} from "../application/resolvers.js";
import { checkApplicantData } from "../applicant/resolvers.js";

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

const applicantQualificationRessolvers = {
  Query: {
    university_details: async () => {
      const result = await getUniversityDetails();
      return result[0];
    },
  },

  Mutation: {
    saveQualifications: async (parent, args, context) => {
      const applicant_id = context.req.user.applicant_id;
      const {
        has_other_qualifications,
        qualifications,
        admissions_id,
        form_no,
        remove_ids,
      } = args;

      try {
        const applicantData = await checkApplicantData(applicant_id, args);

        if (has_other_qualifications) {
          // save the qualifications
          for (const qual of qualifications) {
            const data = {
              applicant_id,
              form_no,
              admissions_id,
              institute_name: qual.institute_name,
              award_obtained: qual.award_obtained,
              award_type: qual.award_type,
              award_duration: qual.award_duration,
              grade: qual.grade,
              awarding_body: qual.awarding_body,
              start_date: new Date(qual.start_date),
              end_date: new Date(qual.end_date),
            };

            const save_id = await saveData({
              table: "applicant_qualifications",
              id: qual.id,
              data,
            });
          }

          // delete the ones to be deleted
          const idsString = remove_ids.join(","); // Convert array to comma-separated string

          if (idsString) {
            const sql = `DELETE FROM applicant_qualifications WHERE id IN (${idsString})`;

            // Execute the SQL query
            await db.execute(sql);
          }
        }

        // lets now update the applications record to notify that the applicant is done with this section
        const _application = await getApplicationForms({
          running_admissions_id: applicantData.admissions_id,
          applicant_id,
          form_no: applicantData.form_no,
          application_details: true,
        });

        if (!_application || _application.length === 0) {
          throw new GraphQLError("Application form not found.");
        }

        const save_id = await saveData({
          table: "applications",
          data: {
            has_other_qualifications,
            qualifications_section_complete: true,
          },
          id: _application[0].id,
        });

        const application = await getApplicationForms({
          id: save_id,
        });

        return {
          success: true,
          message: "Other Qualifications Saved Successfully",
          result: application[0],
        };
      } catch (error) {
        console.log("error", error.message);
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default applicantQualificationRessolvers;
