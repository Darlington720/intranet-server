import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateCourseUnitCode from "../../utilities/generateUniqueCourseUnitCode.js";
import saveData from "../../utilities/db/saveData.js";

const getCourseUnits = async ({ course_version_id }) => {
  try {
    let sql = `SELECT * FROM course_units WHERE course_version_id = ?`;
    let values = [course_version_id];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching modules");
  }
};

const CourseUnitRessolvers = {
  Query: {
    course_units: async (_, args) => {
      const result = await getCourseUnits({
        course_version_id: args.course_version_id,
      });
      return result;
    },
  },
  Mutation: {
    generateModuleCode: async (parent, args) => {
      const { course_code } = args;

      const response = await generateCourseUnitCode(course_code);

      return response;
    },
    saveCourseUnit: async (parent, args) => {
      const { course_unit, saved_by } = args;
      const {
        id,
        course_unit_code,
        course_unit_title,
        course_id,
        course_version_id,
        course_unit_year,
        course_unit_sem,
        course_unit_level,
        credit_units,
        grading_id,
      } = course_unit;

      try {
        const data = {
          course_unit_code,
          course_unit_title,
          course_id,
          course_version_id,
          course_unit_year,
          course_unit_sem,
          course_unit_level,
          credit_units,
          grading_id,
          added_by: saved_by,
          added_on: new Date(),
        };

        const res = await saveData({
          table: "course_units",
          id,
          data,
        });

        // console.log("response", res);

        return {
          success: "true",
          message: "Course unit saved successfully",
        };
      } catch (error) {
        console.log("errr", error);
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default CourseUnitRessolvers;
