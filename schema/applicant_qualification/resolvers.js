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

const applicantQualificationRessolvers = {
  Query: {
    university_details: async () => {
      const result = await getUniversityDetails();
      return result[0];
    },
  },

  Mutation: {
    saveQualifications: async (parent, args) => {
      const {
        has_other_qualifications,
        qualifications,
        applicant_id,
        admissions_id,
        form_no,
        remove_ids,
        completed_form_sections,
      } = args;

      let applicationId = "";

      try {
        if (!form_no) {
          throw new GraphQLError("Please fill in the Bio Data section");
        }
        // console.log("the grgs", args);
        // lets see if the form is already created
        const existingApplicationForm = await getApplicationForms({
          applicant_id,
          admissions_id,
        });

        // console.log("existing application form", existingApplicationForm[0]);

        if (!existingApplicationForm[0]) {
          // now, lets create the form for the applicant
          applicationId = await createApplication(
            applicant_id,
            admissions_id
            // completed_form_sections
          );

          // console.log("existing application form---", applicationId);
        } else {
          // if the application exists, just update the form section ids
          // await updateApplicationCompletedSections(
          //   existingApplicationForm[0].id,
          //   completed_form_sections
          // );
          applicationId = existingApplicationForm[0].id;
        }

        // console.log("existing application id", applicationId);

        if (has_other_qualifications) {
          // now lets work on the actual results
          const idsString = remove_ids.join(","); // Convert array to comma-separated string
          // console.log("ids", idsString);
          if (idsString) {
            const sql = `DELETE FROM applicant_qualifications WHERE id IN (${idsString})`;

            // Execute the SQL query
            const [results, fields] = await db.execute(sql);
          }

          // save the qualifications
          const saveQuals = await qualifications.map(async (qual) => {
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
          });

          await Promise.all(saveQuals);
        }

        await saveData({
          table: "applications",
          id: applicationId,
          data: {
            has_other_qualifications,
          },
        });

        // just update the form section ids
        await updateApplicationCompletedSections(
          applicationId,
          completed_form_sections
        );

        return {
          success: "true",
          message: "Other Qualifications saved Successfully",
        };
      } catch (error) {
        console.log("error", error.message);
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default applicantQualificationRessolvers;
