import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateCourseUnitCode from "../../utilities/generateUniqueCourseUnitCode.js";
import saveData from "../../utilities/db/saveData.js";
import { getCourse } from "../course/resolvers.js";
import softDelete from "../../utilities/db/softDelete.js";
import { getAllGrading } from "../grading/resolvers.js";

export const getCourseUnits = async ({
  course_version_id,
  course_unit_code,
  course_id,
  course_unit_title,
  study_yr,
  sem,
}) => {
  try {
    let where = "";
    let values = [];

    if (course_version_id) {
      where += " AND course_version_id = ?";
      values.push(course_version_id);
    }

    if (course_unit_code) {
      where += " AND course_unit_code = ?";
      values.push(course_unit_code);
    }

    if (course_id) {
      where += " AND course_id = ?";
      values.push(course_id);
    }

    if (course_version_id) {
      where += " AND course_version_id = ?";
      values.push(course_version_id);
    }

    if (course_unit_title) {
      where += " AND course_unit_title = ?";
      values.push(course_unit_title);
    }

    if (study_yr) {
      where += " AND course_unit_year = ?";
      values.push(study_yr);
    }

    if (sem) {
      where += " AND course_unit_sem = ?";
      values.push(sem);
    }

    let sql = `SELECT * FROM course_units WHERE deleted = 0 ${where}`;

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
  CourseUnit: {
    added_user: async (parent, args) => {
      try {
        const user_id = parent.added_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    last_modified_user: async (parent, args) => {
      try {
        const user_id = parent.last_modified_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
  },
  Mutation: {
    generateModuleCode: async (parent, args) => {
      const { course_code } = args;

      const response = await generateCourseUnitCode(course_code);

      return response;
    },
    saveCourseUnit: async (parent, args, context) => {
      const { course_unit } = args;

      const saved_by = context.req.user.id;

      // console.log("unit", course_unit);
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
        let data = {
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

        if (id) {
          data = {
            course_unit_code,
            course_unit_title,
            course_id,
            course_version_id,
            course_unit_year,
            course_unit_sem,
            course_unit_level,
            credit_units,
            grading_id,
            last_modified_by: saved_by,
            last_modified_on: new Date(),
          };
        }

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
    uploadCourseUnits: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const { course_units } = args;

      // Collect all data entries to be inserted
      const fieldsToInsert = await Promise.all(
        course_units.map(async (course_unit) => {
          const {
            module_code,
            module_title,
            course_code,
            course_version,
            credit_units,
            module_level,
            grading_id,
            module_year,
            module_sem,
          } = course_unit;

          // Fetch course details based on course_code and course_version
          const course_details = await getCourse({
            course_code,
            course_version,
          });

          // If course details are missing, you can handle the error here
          if (!course_details[0]) {
            throw new GraphQLError(
              `Course details not found for ${course_code} version ${course_version}`
            );
          }

          // also get the grading details based on the label provided
          const results = await getAllGrading({
            grading_title: grading_id,
          });

          if (!results[0]) {
            throw new GraphQLError(
              `Grading not found for ${course_code} version ${course_version}`
            );
          }

          // Construct the data object for insertion
          return {
            course_unit_code: module_code,
            course_unit_title: module_title,
            course_id: course_details[0].id,
            course_version_id: course_details[0].course_version_id,
            course_unit_year: module_year,
            course_unit_sem: module_sem,
            course_unit_level: module_level,
            credit_units,
            grading_id: results[0].id,
            added_by: user_id,
            added_on: new Date(),
          };
        })
      );

      const results = await saveData({
        table: "course_units",
        data: fieldsToInsert,
      });

      return {
        success: true,
        message: "Course units uploaded successfully",
      };
    },
    deleteCourseUnit: async (parent, args) => {
      const { unit_id } = args;

      // lets first check if this unit has ever been used, if yes -> user cant delete the module

      await softDelete({
        table: "course_units",
        id: unit_id,
      });

      return {
        success: "true",
        message: "Courseunit Deleted Successfully!",
      };
    },
  },
};

export default CourseUnitRessolvers;
