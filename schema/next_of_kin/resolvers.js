import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import {
  createApplication,
  getApplicationForms,
  updateApplicationCompletedSections,
} from "../application/resolvers.js";
import saveData from "../../utilities/db/saveData.js";
import { checkApplicantData } from "../applicant/resolvers.js";

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
    saveNextOfKin: async (parent, args, context) => {
      const applicant_id = context.req.user.applicant_id;

      const applicantData = await checkApplicantData(applicant_id, args);

      const data = {
        applicant_id,
        form_no: applicantData.form_no,
        admissions_id: applicantData.admissions_id,
        full_name: applicantData.full_name,
        email: applicantData.email,
        address: applicantData.address,
        phone_no: applicantData.phone_no,
        relation: applicantData.relation,
      };

      await saveData({
        table: "applicant_next_of_kin",
        id: applicantData.id,
        data,
      });

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
          nok_section_complete: true,
        },
        id: _application[0].id,
      });

      const application = await getApplicationForms({
        id: save_id,
      });

      return {
        success: true,
        message: "Next Of Kin Information Saved Successfully",
        result: application[0],
      };
    },
  },
};

export default nextOfKinResolvers;
