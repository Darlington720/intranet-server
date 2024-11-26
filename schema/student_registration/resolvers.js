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
import { stringify } from "csv-stringify";

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

export const getStudentRegistrationReport = async ({
  campus_id,
  college_id,
  intake_id,
  acc_yr_id,
  study_time_id,
  semester,
  school_id,
  course_id,
  details,
}) => {
  // first we are going to fetch all the students that are enrolled based on the given parameters
  let where = "";
  let values = [];

  if (campus_id) {
    if (campus_id === "all_campuses") {
      where += "";
    } else {
      where += " AND students.campus_id = ?";
      values.push(campus_id);
    }
  }

  if (college_id) {
    where += " AND courses.college_id = ?";
    values.push(college_id);
  }

  if (intake_id) {
    where += " AND students.intake_id = ?";
    values.push(intake_id);
  }

  if (acc_yr_id) {
    where += " AND students_enrollment.acc_yr = ?";
    values.push(acc_yr_id);
  }

  if (study_time_id) {
    if (study_time_id === "all_study_times") {
      where += "";
    } else {
      where += " AND students.study_time_id = ?";
      values.push(study_time_id);
    }
  }

  if (semester) {
    where += " AND students_enrollment.sem = ?";
    values.push(semester);
  }

  if (school_id) {
    where += " AND courses.school_id = ?";
    values.push(school_id);
  }

  if (course_id) {
    where += " AND courses.id = ?";
    values.push(course_id);
  }

  let stds_query = `SELECT
    -- students.id,
    applicants.surname,
    applicants.other_names,
    students.student_no,
    students.registration_no,
    applicants.email,
    -- applicants.phone_no,
    CONCAT("'", phone_no) AS phone_no,
    applicants.gender,
    nationalities.nationality_title AS nationality,
    nationality_categories.category_title AS billing_nationality,
    accyr.acc_yr_title AS entry_acc_yr,
    study_times.study_time_title AS study_time,
    enrollaccyr.acc_yr_title AS acc_yr,
    students_enrollment.study_yr,
    students_enrollment.sem,
    students_enrollment.enrollment_token,
    students_enrollment.datetime AS enrollment_date,
    enrollment_status.title AS enrollment_status,
    courses.course_code,
    courses.course_title,
    levels.level_title AS course_level,
    schools.school_code,
    schools.school_title,
    colleges.college_code,
    colleges.college_title,
    campuses.campus_title AS campus,
    intakes.intake_title AS intake,
    students_registration.registration_token,
    students_registration.provisional,
    students_registration.date AS registration_date,
    students.is_resident,
    students.sponsorship,
    students.hall_of_residence
  FROM students_enrollment
  LEFT JOIN students ON students.student_no = students_enrollment.stdno
  LEFT JOIN campuses ON students.campus_id = campuses.id
  LEFT JOIN intakes ON students.intake_id = intakes.id
  LEFT JOIN applicants ON students.applicant_id = applicants.id
  LEFT JOIN nationalities ON applicants.nationality_id = nationalities.id
  LEFT JOIN nationality_categories ON nationalities.nationality_category_id = nationality_categories.id
  LEFT JOIN acc_yrs accyr ON students.entry_acc_yr = accyr.id
  LEFT JOIN study_times ON study_times.id = students.study_time_id
  LEFT JOIN courses ON students.course_id = courses.id
  LEFT JOIN levels ON courses.level = levels.id
  LEFT JOIN schools ON courses.school_id = schools.id
  LEFT JOIN colleges ON colleges.id = courses.college_id
  LEFT JOIN acc_yrs enrollaccyr ON students_enrollment.acc_yr = enrollaccyr.id
  LEFT JOIN enrollment_status ON students_enrollment.enrollment_status_id = enrollment_status.id
  LEFT JOIN students_registration ON students_registration.enrollment_token = students_enrollment.enrollment_token
  WHERE students_enrollment.deleted = 0 ${where}
  ORDER BY students_enrollment.study_yr DESC,students_enrollment.sem DESC, students_enrollment.datetime DESC`;

  let totals_sql = `
 SELECT 
    COUNT(DISTINCT CASE WHEN students_enrollment.enrollment_token IS NOT NULL THEN students.id END) AS total_enrolled,
    COUNT(DISTINCT CASE WHEN students_registration.provisional = 1 THEN students.id END) AS total_provisional,
    COUNT(DISTINCT CASE WHEN students_registration.provisional = 0 THEN students.id END) AS total_registered
FROM 
    students_enrollment
LEFT JOIN students ON students.student_no = students_enrollment.stdno
LEFT JOIN courses ON students.course_id = courses.id
LEFT JOIN students_registration ON students_registration.enrollment_token = students_enrollment.enrollment_token
WHERE 
    students_enrollment.deleted = 0
    ${where}; 
 `;

  let sql = `
  SELECT 
    schools.id AS school_id,
    schools.school_code,
    schools.school_title,
    courses.id AS course_id,
    courses.course_title,
    courses.course_code,
    students_enrollment.study_yr,
    COUNT(DISTINCT CASE WHEN students_enrollment.enrollment_token IS NOT NULL THEN students.id END) AS total_enrolled,
    COUNT(DISTINCT CASE WHEN students_registration.provisional = 1 THEN students.id END) AS total_provisional,
    COUNT(DISTINCT CASE WHEN students_registration.provisional = 0 THEN students.id END) AS total_registered
    FROM 
        students_enrollment 
    LEFT JOIN students ON students.student_no = students_enrollment.stdno
    LEFT JOIN campuses ON students.campus_id = campuses.id
    LEFT JOIN intakes ON students.intake_id = intakes.id
    LEFT JOIN applicants ON students.applicant_id = applicants.id
    LEFT JOIN nationalities ON applicants.nationality_id = nationalities.id
    LEFT JOIN nationality_categories ON nationalities.nationality_category_id = nationality_categories.id
    LEFT JOIN acc_yrs accyr ON students.entry_acc_yr = accyr.id
    LEFT JOIN study_times ON study_times.id = students.study_time_id
    LEFT JOIN courses ON students.course_id = courses.id
    LEFT JOIN schools ON courses.school_id = schools.id
    LEFT JOIN colleges ON colleges.id = courses.college_id
    LEFT JOIN acc_yrs enrollaccyr ON students_enrollment.acc_yr = enrollaccyr.id
    LEFT JOIN enrollment_status ON students_enrollment.enrollment_status_id = enrollment_status.id
    LEFT JOIN students_registration ON students_registration.enrollment_token = students_enrollment.enrollment_token
    WHERE 
        students_enrollment.deleted = 0
        ${where}
    GROUP BY 
        schools.id, schools.school_title,
        courses.id, courses.course_title, students_enrollment.study_yr
    ORDER BY 
        schools.school_title, courses.course_title, students_enrollment.study_yr;   
  `;

  if (details) {
    // returning students
    const [results] = await db.execute(stds_query, values);

    // console.log("results", results);
    return results;
  } else {
    const [results] = await db.execute(sql, values);
    const [totals] = await db.execute(totals_sql, values);
    // console.log("results", results);
    return {
      totals,
      results,
    };
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
    student_registration_report: async (parent, args) => {
      const {
        campus_id,
        college_id,
        intake_id,
        acc_yr_id,
        study_time_id,
        semester,
      } = args.payload;

      const result = await getStudentRegistrationReport({
        campus_id,
        college_id,
        intake_id,
        acc_yr_id,
        study_time_id,
        semester,
      });
      // console.log("result", result);
      return {
        totals: result.totals[0],
        report_summary: result.results,
      };
    },
    get_students: async (parent, args) => {
      const {
        campus_id,
        college_id,
        intake_id,
        acc_yr_id,
        study_time_id,
        semester,
        school_id,
        course_id,
      } = args.payload;

      const result = await getStudentRegistrationReport({
        campus_id,
        college_id,
        intake_id,
        acc_yr_id,
        study_time_id,
        semester,
        school_id,
        course_id,
        details: true,
      });
      // console.log("result", result);
      return result;
    },
    download_report: async (_, args, { res }) => {
      try {
        const downloadUrl = `/download-student-reg-report`;
        return `http://localhost:2222${downloadUrl}`;
      } catch (error) {
        console.error("Error generating report:", error);
        throw new GraphQLError(
          "An error occurred while generating the report."
        );
      }
    },
  },
  StudentRegistration: {
    registered_user: async (parent, args) => {
      try {
        const user_id = parent.registered_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user");
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
        provisional,
        provisional_reason,
        provisional_expiry,
      } = args.payload;

      console.log("payload", args.payload);

      await db.beginTransaction();
      try {
        if (provisional) {
          // first, lets check for the existing registration record
          const existingRegistration = await getStudentRegistrationHistory({
            std_no: student_no,
            study_yr,
            sem,
          });

          const _d = {
            student_no,
            registration_token: null,
            enrollment_token,
            acc_yr_id,
            study_yr,
            sem,
            reg_comments,
            registered_by: user_id,
            date: new Date(),
            provisional,
            provisional_reason,
            provisional_expiry: new Date(provisional_expiry),
          };

          saveData({
            table: "students_registration",
            data: _d,
            id:
              existingRegistration.length > 0
                ? existingRegistration[0].id
                : null,
          });
        } else {
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

          if (
            existingRegistration.length > 0 &&
            existingRegistration[0].provisional === false
          ) {
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
            provisional: 0,
          };

          saveData({
            table: "students_registration",
            data,
            id:
              existingRegistration.length > 0
                ? existingRegistration[0].id
                : null,
          });
        }

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
