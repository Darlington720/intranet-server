import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";

export const getEnrollmentTypes = async ({ id, enrollent_codes }) => {
  let where = "";
  let values = [];

  try {
    if (id) {
      where += " AND enrollment_status.id = ?";
      values.push(id);
    }

    if (enrollent_codes && Array.isArray(enrollent_codes)) {
      where +=
        " AND code IN (" + enrollent_codes.map(() => "?").join(", ") + ")";
      values.push(...enrollent_codes); // Spread the array as separate values
    }

    let sql = `SELECT * FROM enrollment_status WHERE deleted = 0 ${where} ORDER BY id ASC`;

    const [results] = await db.execute(sql, values);

    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching enrollment types " + error.message);
  }
};

const EnrollmentStatusResolvers = {
  Query: {
    enrollment_types: async () => {
      const result = await getEnrollmentTypes({});

      // if (study_yr || semester || course_duration) {
      //   // lets first consider freshmen
      //   if (study_yr == "1" && semester == "1") {
      //     newArr.push(result[0]) // new student
      //   } else if (parseInt(study_yr) == course_duration) {
      //     newArr.push(result[1])
      //   }

      return result;
    },
  },
};

export default EnrollmentStatusResolvers;
