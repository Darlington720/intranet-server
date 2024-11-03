import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import {
  createApplication,
  getApplicationForms,
  updateApplicationCompletedSections,
} from "../application/resolvers.js";
import saveData from "../../utilities/db/saveData.js";

export const getApplicantNextOfKin = async ({
  id,
  applicant_id,
  form_no,
  admissions_id,
}) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where += " AND applicant_next_of_kin.id = ?";
      values.push(id);
    }

    if (applicant_id) {
      where += " AND applicant_next_of_kin.applicant_id = ?";
      values.push(applicant_id);
    }

    if (admissions_id) {
      where += " AND applicant_next_of_kin.admissions_id = ?";
      values.push(admissions_id);
    }

    if (form_no) {
      where += " AND applicant_next_of_kin.form_no = ?";
      values.push(form_no);
    }

    let sql = `SELECT *
      FROM 
      applicant_next_of_kin
      WHERE applicant_next_of_kin.deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error.message);
    throw new GraphQLError(
      "Error fetching other applicant attachments " + error.message,
      {
        extensions: {
          code: "UNAUTHENTICATED",
          http: { status: 501 },
        },
      }
    );
  }
};

const nextOfKinResolvers = {
  Query: {
    // nationalities: async () => {
    //   const result = await getAllNationalities();
    //   return result;
    // },
  },
  Mutation: {
    saveNextOfKin: async (parent, args) => {
      const {
        id,
        applicant_id,
        form_no,
        admissions_id,
        full_name,
        email,
        address,
        phone_no,
        relation,
        completed_form_sections,
      } = args;

      let applicationId = "";

      if (!form_no) {
        throw new GraphQLError("Please fill in the Bio Data section");
      }

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
        applicationId = existingApplicationForm[0].id;
      }

      const data = {
        applicant_id,
        form_no,
        admissions_id,
        full_name,
        email,
        address,
        phone_no,
        relation,
      };

      const save_id = await saveData({
        table: "applicant_next_of_kin",
        id,
        data,
      });

      // just update the form section ids
      await updateApplicationCompletedSections(
        applicationId,
        completed_form_sections
      );

      return {
        success: "true",
        message: "Next of kin saved Successfully",
      };
    },
  },
};

export default nextOfKinResolvers;
