import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { getStudents } from "../student/resolvers.js";
import {
  getMissingMarks,
  getStdMarks,
  getStdResults,
} from "../student_marks/resolvers.js";
import { getCourseUnits } from "../course_unit/resolvers.js";
import saveData from "../../utilities/db/saveData.js";

const getGraduationSections = async ({ is_resident, level_id }) => {
  try {
    let conditions = ["deleted = 0"];
    let values = [];

    if (is_resident !== undefined) {
      conditions.push("for_residents = ?");
      values.push(is_resident);
    }

    if (level_id) {
      conditions.push("(level_id = ? OR level_id IS NULL)");
      values.push(level_id);
    }

    let sql = `SELECT * FROM graduation_sections WHERE ${conditions.join(
      " AND "
    )} ORDER BY graduation_sections.sort ASC`;

    const [results] = await db.execute(sql, values);
    return results;
  } catch (error) {
    console.error("Error fetching graduation sections:", error);
    throw new GraphQLError("Error fetching graduation sections!");
  }
};

// export const checkGraduationElligibilty = ({
//   std_no
// }) => {
//   // the student is elligible only if he has aall the results as per version

// }

const graduationSectionRessolvers = {
  Query: {
    graduation_sections: async (parent, args, context) => {
      const student_no = context.req.user.student_no;

      const [studentDetails] = await getStudents({
        std_no: student_no || null,
        get_course_details: true,
      });

      const result = await getGraduationSections({
        is_resident: studentDetails?.is_resident,
        level_id: studentDetails?.level || null,
      });
      return result;
    },
    check_graduation_elligibility: async (parent, args, context) => {
      const student_no = context.req.user.student_no;
      let has_missed_papers = false;
      let has_retakes = false;

      const [studentDetails] = await getStudents({
        std_no: student_no,
      });

      // get student results
      const studentMarks = await getStdResults({
        student_no: student_no,
      });

      // then the course units
      const courseUnits = await getCourseUnits({
        course_version_id: studentDetails.course_version_id,
        course_id: studentDetails.course_id,
      });

      const missingMarks = courseUnits.filter(
        (unit) => !studentMarks.some((mark) => mark.module_id === unit.id)
      );

      const removedElectiveUnits = missingMarks.filter(
        (mark) => mark.course_unit_level != "elective"
      );

      // filtering retakes from the alreaady done subjects
      const retakes = studentMarks.filter((mark) => mark.grade == "F");

      // console.log("missingMarks", removedElectiveUnits);
      // console.log("retakes", retakes);

      if (removedElectiveUnits.length > 0 || studentMarks.length == 0) {
        has_missed_papers = true;
      }

      if (retakes.length > 0) {
        has_retakes = true;
      }

      return {
        has_missed_papers,
        has_retakes,
      };
    },
  },
  Mutation: {
    verify_student_credentials: async (parent, args, context) => {
      const student_no = context.req.user.student_no;
      const {
        surname,
        othernames,
        email,
        phone_no,
        place_of_residence,
        date_of_birth,
        gender,
        country_of_origin,
        nationality,
      } = args.payload;
      try {
        // use the student number to get the applicant id
        const [student] = await getStudents({
          std_no: student_no,
          fetchStdBio: true,
        });

        // console.log(student);

        if (!student) {
          throw new GraphQLError("Failed to get Student!");
        }
        // save data in the applicants table
        const data = {
          surname,
          other_names: othernames,
          email,
          phone_no,
          nationality_id: nationality,
          date_of_birth,
          gender,
          place_of_residence,
          country_of_origin,
          verified_credentials: true,
          credentials_verified_on: new Date(),
          credentials_verified_by: `${student.surname} ${student.other_names}`,
        };

        await saveData({
          table: "applicants",
          data,
          id: student.applicant_id,
        });

        return {
          success: true,
          message: "Credentials saved Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default graduationSectionRessolvers;
