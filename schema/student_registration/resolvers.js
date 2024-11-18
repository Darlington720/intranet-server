import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import { getRunningSemesters } from "../academic_schedule/resolvers.js";
import generateToken from "../../utilities/generateToken.js";
import saveData from "../../utilities/db/saveData.js";
import { getStudent, getStudents } from "../student/resolvers.js";
import { getEnrollmentTypes } from "../enrollment_status/resolvers.js";
import getStudentProgress from "../../utilities/calculateCurrentSemester.js";
import calculateSemestersSkipped from "../../utilities/calculateSemestersSkipped.js";
import {
  findDeadSemesters,
  generateSemesterList,
  generateSemesterListForNormalProgress,
} from "../../utilities/calculateEnrollment.js";
import { getAccYrs } from "../acc_yr/resolvers.js";
import generateDeadSemToken from "../../utilities/generateDeadSemToken.js";
import softDelete from "../../utilities/db/softDelete.js";
import {
  createDeadSemInvoice,
  createFunctionalInvoice,
  createTuitionInvoice,
  getStudentInvoices,
} from "../invoice/resolvers.js";
import generateInvoiceNo from "../../utilities/generateInvoiceNo.js";
import generateRegistrationToken from "../../utilities/generateRegistrationToken.js";

export const getStudentRegistrationHistory = async ({
  std_no,
  study_yr,
  sem,
}) => {
  try {
    let where = "";
    let values = [];

    if (std_no) {
      where += " AND students_registration.student_no = ?";
      values.push(std_no);
    }

    if (study_yr) {
      where += " AND students_registration.study_yr = ?";
      values.push(study_yr);
    }

    if (sem) {
      where += " AND students_registration.sem = ?";
      values.push(sem);
    }

    let sql = `SELECT students_registration.*, acc_yrs.acc_yr_title
    FROM students_registration 
    LEFT JOIN acc_yrs ON acc_yrs.id = students_registration.acc_yr_id
    WHERE students_registration.deleted = 0 ${where} ORDER BY students_registration.study_yr DESC,students_registration.sem DESC, students_registration.date DESC `;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching enrollment " + error.message);
  }
};

const studentRegistrationResolvers = {
  Query: {
    student_registration_history: async (parent, args) => {
      const { student_no } = args;
      const result = await getStudentRegistrationHistory({
        std_no: student_no,
      });
      return result;
    },
  },
  StudentEnrollment: {
    // added_user: async (parent, args) => {
    //   try {
    //     const user_id = parent.added_by;
    //     let sql = `SELECT * FROM staff WHERE id = ?`;

    //     let values = [user_id];

    //     const [results, fields] = await db.execute(sql, values);
    //     // console.log("results", results);
    //     return results[0]; // expecting the one who added the user
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError("Error fetching user", {
    //       extensions: {
    //         code: "UNAUTHENTICATED",
    //         http: { status: 501 },
    //       },
    //     });
    //   }
    // },
    // modified_user: async (parent, args) => {
    //   try {
    //     const user_id = parent.modified_by;
    //     let sql = `SELECT * FROM staff WHERE id = ?`;

    //     let values = [user_id];

    //     const [results, fields] = await db.execute(sql, values);
    //     // console.log("results", results);
    //     return results[0]; // expecting the one who added the user
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError("Error fetching user", {
    //       extensions: {
    //         code: "UNAUTHENTICATED",
    //         http: { status: 501 },
    //       },
    //     });
    //   }
    // },
    enrollment_status: async (parent, args) => {
      const enrollment_status_id = parent.enrollment_status_id;

      // console.log("enrollment status id", enrollment_status_id);

      try {
        const results = await getEnrollmentTypes({
          id: enrollment_status_id,
        });

        return results[0];
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  Mutation: {
    registerStudent: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const {
        student_no,
        acc_yr_id,
        study_yr,
        sem,
        reg_comments,
        enrollment_token,
      } = args.payload;

      await db.beginTransaction();
      try {
        // first, lets check if the student has no pending bills
        const invoices = await getStudentInvoices({
          student_no,
        });

        // let get all the unpaid invoices
        const unpaidInvoices = invoices.filter((inv) => inv.amount_due > 0);

        if (unpaidInvoices.length > 0) {
          throw new GraphQLError(
            "Registration is only allowed if the student fulfills the university's fees Policy"
          );
        }

        // now lets check if the student is already registered in the provided, study_year and sem
        const existingRegistration = await getStudentRegistrationHistory({
          std_no: student_no,
          study_yr,
          sem,
        });

        if (existingRegistration.length > 0) {
          throw new GraphQLError(
            "Student is already registered for this study year, and semester."
          );
        }

        // at this point, the studdent has no pending invoices
        const registrationToken = generateRegistrationToken();
        const data = {
          student_no,
          registration_token: registrationToken,
          enrollment_token,
          acc_yr_id,
          study_yr,
          sem,
          reg_comments,
          registered_by: user_id,
          date: new Date(),
        };

        saveData({
          table: "students_registration",
          data,
          id: null,
        });

        await db.commit();

        return {
          success: "true",
          message: "Student Registered Successfully",
        };
      } catch (error) {
        await db.rollback();
        throw new GraphQLError(error.message);
      }
    },
    savePastEnrollment: async (parent, args) => {
      const {
        student_id,
        student_no,
        acc_yr,
        study_yr,
        semester,
        intake,
        enrollment_status,
        enrolled_by,
      } = args;

      // fetch the active_Sem id
      const theSem = await getRunningSemesters({
        acc_yr: acc_yr,
        sem: semester,
        intake_id: intake,
      });

      const data = {
        enrollment_token: generateToken(),
        stdno: student_no,
        std_id: student_id,
        // acc_yr: acc_yrs[0].id,
        acc_yr: acc_yr,
        // study_yr: nextEnrollment.studyYear,
        study_yr: study_yr,
        sem: semester,
        enrollment_status_id: enrollment_status,
        datetime: new Date(),
        enrolled_by,
        active_sem_id: theSem[0] ? theSem[0].id : null,
        next_sem: null,
        invoiced: 0,
      };

      await saveData({
        table: "students_enrollment",
        data,
        id: null,
      });

      return {
        success: "true",
        message: "Enrollment Saved Successfully",
      };
    },
    deleteEnrollment: async (parent, args) => {
      const { enrollment_id } = args;

      try {
        await softDelete({
          table: "students_enrollment",
          id: enrollment_id,
        });

        return {
          success: "true",
          message: "Enrollment Succesfully Deleted",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    editEnrollment: async (parent, args) => {
      const {
        enrollment_id,
        acc_yr,
        study_yr,
        semester,
        enrollment_status,
        enrolled_by,
        invoice,
      } = args;

      try {
        const data = {
          acc_yr: acc_yr,
          // study_yr: nextEnrollment.studyYear,
          study_yr: study_yr,
          sem: semester,
          enrollment_status_id: enrollment_status,
          enrolled_by,
          // active_sem_id: theSem[0] ? theSem[0].id : null,
          // next_sem: null,
          invoiced: invoice,
        };

        await saveData({
          table: "students_enrollment",
          id: enrollment_id,
          data,
        });

        return {
          success: "true",
          message: "Enrollment Succesfully Saved",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default studentRegistrationResolvers;
