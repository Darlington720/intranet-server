import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

export const getApplicantFormSections = async ({ admission_level_id }) => {
  try {
    let where = "";
    let values = [];

    if (admission_level_id) {
      where += " AND (admission_level_id = ? OR admission_level_id IS NULL)";
      values.push(admission_level_id);
    }

    let sql = `SELECT section_id, section_title FROM applicant_form_sections WHERE deleted = 0 ${where} ORDER BY section_order ASC`;

    const [results] = await db.execute(sql, values);

    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching form sections");
  }
};

const applicantFormSectionsResolvers = {
  Query: {
    applicant_form_sections: async (parent, args) => {
      const result = await getApplicantFormSections({});
      return result;
    },
  },
};

export default applicantFormSectionsResolvers;
