import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateCourseUnitCode from "../../utilities/generateUniqueCourseUnitCode.js";
import saveData from "../../utilities/db/saveData.js";
import { getCourse } from "../course/resolvers.js";
import softDelete from "../../utilities/db/softDelete.js";
import { getAllGrading } from "../grading/resolvers.js";
import { createMissedAndRetakeInvoice } from "../invoice/resolvers.js";
import { getStudents } from "../student/resolvers.js";

const getStudentRegisteredModules = async ({
  student_no,
  study_yr,
  sem,
  course_unit_code,
  status,
}) => {
  try {
    let values = [];
    let where = "";

    if (student_no) {
      where += " AND student_registered_modules.student_no = ?";
      values.push(student_no);
    }

    if (study_yr) {
      where += " AND student_registered_modules.study_year = ?";
      values.push(study_yr);
    }

    if (sem) {
      where += " AND student_registered_modules.semester = ?";
      values.push(sem);
    }

    if (course_unit_code) {
      where += " AND student_registered_modules.course_unit_code = ?";
      values.push(course_unit_code);
    }

    if (status) {
      where += " AND student_registered_modules.status = ?";
      values.push(status);
    }

    let sql = `SELECT * FROM student_registered_modules WHERE deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError(
      "Error fetching student registered modules " + error.message
    );
  }
};

const getStudentCourseUnit = async ({ student_no, course_unit_code }) => {
  // first we need to know the course and course version for this student
  try {
    let sql = `
    SELECT cu.*
        FROM students s
        INNER JOIN course_units cu 
            ON s.course_id = cu.course_id 
            AND s.course_version_id = cu.course_version_id 
        WHERE s.student_no = ? 
          AND cu.course_unit_code = ?
    `;

    let values = [student_no, course_unit_code];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    throw new GraphQLError("Failed to get course unit " + error.message);
  }
};

const StudentRegisteredCourseUnitRessolvers = {
  Query: {
    student_registered_courseunits: async (_, args) => {
      const { student_no, study_year, sem } = args;

      const results = await getStudentRegisteredModules({
        student_no,
        study_yr: study_year,
        sem,
      });

      return results;
    },
  },
  StudentRegisteredCourseUnit: {
    enrolled_user: async (parent, args) => {
      try {
        const user_id = parent.enrolled_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        throw new GraphQLError("Error fetching user");
      }
    },
    course_unit: async (parent, args) => {
      const course_unit_code = parent.course_unit_code;
      const student_no = parent.student_no;

      const results = await getStudentCourseUnit({
        student_no,
        course_unit_code,
      });

      return results[0];
    },
  },
  Mutation: {
    register_module: async (parent, args, context) => {
      const { student_no, course_unit_code, study_yr, sem, status } =
        args.payload;

      const MAX_NUMBER_OF_NORMAL_PAPERS = 6;
      const MAX_NUMBER_OF_PAPERS = 8;

      const today = new Date();
      let retake_count = 0;
      let invoice_no = null;
      let connection;
      connection = await db.getConnection();

      try {
        const user_id = context.req.user.id;

        // no duplication is allowed, lets first check if the module is already registered
        const results = await getStudentRegisteredModules({
          student_no,
          study_yr,
          sem,
          course_unit_code,
        });

        if (results.length > 0) {
          throw new GraphQLError("Module is already registered");
        }

        // check if the course unit is elligible to be done a normal paper
        if (status == "normal") {
          const results3 = await getStudentRegisteredModules({
            student_no,
            course_unit_code,
            status,
          });

          if (results3.length > 0) {
            throw new GraphQLError(
              `Student can't do this course unit as a normal paper beccause it is already enrolled as a normal paper in Year: ${results3[0].study_year}, Semester: ${results3[0].semester}`
            );
          }
        }

        // check if the student has reached the maximum number of normal papers
        const results2 = await getStudentRegisteredModules({
          student_no,
          study_yr,
          sem,
        });

        const normalPapers = results2.filter(
          (enrollment) => enrollment.status == "normal"
        );

        if (status == "normal") {
          if (normalPapers.length >= MAX_NUMBER_OF_NORMAL_PAPERS) {
            throw new GraphQLError(
              "Maximum of NORMAL papers to be done in a semester is reached"
            );
          }
        }

        if (results2.length >= MAX_NUMBER_OF_PAPERS) {
          throw new GraphQLError(
            "Maximum of papers to be done in a semester is reached"
          );
        }

        // db.beginTransaction();

        // Start the transaction
        await connection.beginTransaction();
        // now lets cater for retakes and missed papers -> invoices have to be generated in enrollment
        if (status == "retake" || status == "missed") {
          // console.log("args", args.payload);

          const student = await getStudents({
            std_no: student_no,
            get_course_details: true,
          });

          invoice_no = await createMissedAndRetakeInvoice({
            student_details: student,
            student_no,
            academic_year: args.payload.acc_yr_id,
            study_year: study_yr,
            semester: sem,
            invoice_category: status,
            invoice_type: "MANDATORY",
            course_unit_code,
          });
        }

        let data = {
          student_no,
          course_unit_code,
          status,
          study_year: study_yr,
          semester: sem,
          invoice_no,
          enrolled_on: today,
          enrolled_by: user_id,
        };

        if (status == "retake") {
          // check if the same is enrolled with retake
          const existing = await getStudentRegisteredModules({
            student_no,
            course_unit_code,
            status: "retake",
          });

          if (existing.length == 0) {
            retake_count = 1;
          } else {
            // console.log("retake", existing);
            retake_count = existing[existing.length - 1].retake_count + 1;
          }

          data = { ...data, retake_count };
        }

        // console.log("the data", data);

        await saveData({
          table: "student_registered_modules",
          data,
          id: null,
        });

        await connection.commit();

        return {
          success: "true",
          message: "Module Registered Successfully",
        };
      } catch (error) {
        connection.rollback();
        throw new GraphQLError(error.message);
      } finally {
        if (connection) {
          // Release the connection back to the pool
          connection.release();
        }
      }
    },
    remove_module: async (parent, args) => {
      const { module_id } = args;

      try {
        await softDelete({
          table: "student_registered_modules",
          id: module_id,
        });

        return {
          success: "true",
          message: "Module removed Succesfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default StudentRegisteredCourseUnitRessolvers;
