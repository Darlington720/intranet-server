import jwt from "jsonwebtoken";
import { db, PORTAL_PRIVATE_KEY, PRIVATE_KEY } from "../../config/config.js";
import sendEmail from "../../utilities/emails/email-otp.js";
import bcrypt from "bcrypt";
import generateFormNumber from "../../utilities/generateApplicationFormNo.js";
import { getAllRunningAdmissions } from "../running_admissions/resolvers.js";
import saveData from "../../utilities/db/saveData.js";
import { getRunningSemesters } from "../academic_schedule/resolvers.js";
import { getStudentEnrollment } from "../student_enrollment/resolvers.js";
import {
  createFunctionalInvoiceV2,
  createTuitionInvoiceV2,
  getStudentInvoices,
} from "../invoice/resolvers.js";
import { getStudentRegistrationHistory } from "../student_registration/resolvers.js";
import generateEnrollmentToken from "../../utilities/generateToken.js";
import chunk from "lodash.chunk";
import fetchOrCreateRecord from "../../utilities/helpers/fetchOrCreateRecord.js";
import { getCourse, getCourseVersionDetails } from "../course/resolvers.js";
import fetchOrCreateEnrollmentStatus from "../../utilities/helpers/fetchOrCreateEnrollmentStatus.js";
import saveDataWithOutDuplicates from "../../utilities/db/saveDataWithOutDuplicates.js";
import { GraphQLError } from "graphql";
import { getStdResults } from "../student_marks/resolvers.js";
import calculateGrades from "../../utilities/helpers/calculateGrades.js";
import calculateNextEnrollment from "../../utilities/helpers/calculateNextEnrollment.js";
import { getEnrollmentTypes } from "../enrollment_status/resolvers.js";

export const getApplicant = async (applicant_id) => {
  try {
    let sql = `SELECT applicants.*, salutations.salutation_code AS salutation FROM applicants 
    LEFT JOIN salutations ON applicants.salutation_id = salutations.id
    WHERE applicants.id = ? `;
    let values = [applicant_id];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results[0];
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError(error.message);
  }
};

export const getStudent = async (std_id) => {
  try {
    let where = "";

    let sql = `SELECT * FROM students WHERE id = ? AND deleted = 0`;
    let values = [std_id];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results[0];
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError(error.message);
  }
};

export const getStudentLogin = async ({ student_no }) => {
  try {
    let where = "";
    let values = [];

    if (student_no) {
      where += " AND student_no = ?";
      values.push(student_no);
    }

    let sql = `SELECT * FROM student_logins WHERE deleted = 0 ${where}`;

    const [results] = await db.execute(sql, values);

    return results;
  } catch (error) {
    throw new GraphQLError(error.message);
  }
};

export const getStudents = async ({
  std_id,
  campus_id,
  intake_id,
  acc_yr_id,
  course_version_id,
  sic,
  std_no,
  regno,
  study_time,
  get_course_details = false,
  fetchStdBio = false,
}) => {
  try {
    let where = "";
    let extra_select = "";
    let extra_join = "";
    let values = [];

    if (Array.isArray(std_no) && std_no.length > 0) {
      // Handle multiple student numbers
      const placeholders = std_no.map(() => "?").join(", ");
      where += ` AND students.student_no IN (${placeholders})`;
      values.push(...std_no);
    } else if (std_no) {
      // Handle single student number
      where += " AND students.student_no = ?";
      values.push(std_no);
    }

    // if (std_no) {
    //   where += " AND students.student_no = ?";
    //   values.push(std_no);
    // }

    if (regno) {
      where += " AND students.registration_no = ?";
      values.push(regno);
    }

    if (std_id) {
      where += " AND students.id = ?";
      values.push(std_id);
    }

    if (sic) {
      where += " AND students.is_std_verified = ?";
      values.push(1); // only verified students to student information center
    }

    if (campus_id) {
      where += " AND students.campus_id = ?";
      values.push(campus_id);
    }

    if (acc_yr_id) {
      where += " AND students.entry_acc_yr = ?";
      values.push(acc_yr_id);
    }

    if (intake_id) {
      if (intake_id == "all") {
        where += " AND students.intake_id IS NOT NULL";
      } else {
        where += " AND students.intake_id = ?";
        values.push(intake_id);
      }
    }

    if (study_time) {
      if (study_time == "all") {
        where += " AND students.study_time_id IS NOT NULL";
      } else {
        where += " AND students.study_time_id = ?";
        values.push(study_time);
      }
    }

    if (course_version_id) {
      where += " AND students.course_version_id = ?";
      values.push(course_version_id);
    }

    if (get_course_details) {
      extra_join += " LEFT JOIN courses ON courses.id = students.course_id";
      extra_select += " ,courses.course_duration, courses.level";
    }

    if (fetchStdBio) {
      extra_join +=
        " LEFT JOIN applicants ON applicants.id = students.applicant_id LEFT JOIN nationality_categories ON applicants.nationality_id = nationality_categories.id";
      extra_select += " ,nationality_categories.id as nationality_category_id";
    }

    let sql = `SELECT 
      students.*, 
      intakes.intake_title, 
      acc_yrs.acc_yr_title as entry_acc_yr_title, 
      campuses.campus_title, 
      study_times.study_time_title ${extra_select} 
    FROM students 
    LEFT JOIN intakes ON students.intake_id = intakes.id
    LEFT JOIN acc_yrs ON students.entry_acc_yr = acc_yrs.id
    LEFT JOIN campuses ON students.campus_id = campuses.id
    LEFT JOIN study_times ON study_times.id = students.study_time_id
    ${extra_join}
    WHERE students.deleted = 0 ${where}`;
    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError(error.message);
  }
};

export const getStudentAccountBalance = async ({ student_no }) => {
  // let check in the student transactions
  let where = "";
  let values = [];

  try {
    if (student_no) {
      where += " AND transactions.student_no = ?";
      values.push(student_no);
    }

    let sql = `SELECT SUM(unallocated) AS account_balance from transactions WHERE deleted = 0 AND is_pp = 1 ${where}`;

    const [results] = await db.execute(sql, values);

    // console.log("results", results[0]);
    return results[0].account_balance;
  } catch (error) {
    console.log("error getting account balance", error.message);
    throw new GraphQLError(error.message);
  }
};

const studentResolvers = {
  Query: {
    students: async (parent, args) => {
      const { campus, intake, acc_yr, course_version, sic } = args;
      // console.log("args", args);
      try {
        const students = await getStudents({
          campus_id: campus,
          intake_id: intake,
          acc_yr_id: acc_yr,
          course_version_id: course_version,
          sic,
        });

        return students;
      } catch (error) {
        console.log("err", error.message);
        throw new GraphQLError(error.message);
      }
    },

    loadStudentFile: async (parent, args) => {
      const { student_id, student_no } = args;
      // console.log("args", args);
      try {
        let enrollment_status = null;
        const students = await getStudents({
          std_no: student_no,
          std_id: student_id,
        });

        // now enrollment status.
        // first we are going to first check for the running university semesters
        // and then speccify that we need the one where the student intake falls under
        if (!students[0]) return null;

        const running_semesters = await getRunningSemesters({
          intake_id: students[0].intake_id,
        });

        // console.log("running sems", running_semesters);

        // will later cater for when there is no running sem
        // if (!running_semesters[0]) return

        // now lets check if the student has any record of enrollment with the obtained active_sem id
        const student_enrollment = await getStudentEnrollment({
          std_no: student_no,
          active_sem_id: running_semesters[0]?.id,
        });

        // console.log(student_enrollment);

        if (!student_enrollment[0]) {
          // student is not yet enrolled
          enrollment_status = `Not Enrolled in Sem ${
            running_semesters[0].semester || 1
          }`;
        } else {
          enrollment_status = "Enrolled";
        }

        return { ...students[0], enrollment_status };
      } catch (error) {
        // console.log("err", error.message);
        throw new GraphQLError(error.message);
      }
    },

    student_autocomplete: async (parent, args) => {
      const { query } = args;
      // console.log("args", args);
      try {
        const search_term = `%${query}%`;
        const sql = `SELECT 
              students.student_no, 
              students.registration_no, 
              students.course_id, 
              CONCAT(applicants.surname, ' ', applicants.other_names) AS name, 
              student_images.id
             FROM students 
             LEFT JOIN applicants ON applicants.id = students.applicant_id
             LEFT JOIN student_images ON student_images.stdno = students.student_no
             WHERE students.is_std_verified = ? 
             AND (student_no LIKE ? OR CONCAT(applicants.surname, ' ', applicants.other_names) LIKE ?)
             LIMIT 10;`;

        const values = [1, search_term, search_term];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results;
      } catch (error) {
        // console.log("err", error.message);
        throw new GraphQLError(error.message);
      }
    },

    my_details: async (parent, args, context) => {
      const student_no = context.req.user.student_no;

      try {
        let enrollment_status = null;
        const students = await getStudents({
          std_no: student_no,
        });

        // now enrollment status.
        // first we are going to first check for the running university semesters
        // and then speccify that we need the one where the student intake falls under
        if (!students[0]) throw new GraphQLError("Student not found");

        const running_semesters = await getRunningSemesters({
          intake_id: students[0].intake_id,
        });

        // now lets check if the student has any record of enrollment with the obtained active_sem id
        const student_enrollment = await getStudentEnrollment({
          std_no: student_no,
          active_sem_id: running_semesters[0]?.id,
        });

        // console.log(student_enrollment);

        if (!student_enrollment[0]) {
          // student is not yet enrolled
          enrollment_status = `Not Enrolled in Sem ${running_semesters[0].semester}`;
        } else {
          enrollment_status = "Enrolled";
        }

        return { ...students[0], enrollment_status };
      } catch (error) {
        // console.log("err", error.message);
        throw new GraphQLError(error.message);
      }
    },
    my_results: async (parent, args, context) => {
      const student_no = context.req.user.student_no;

      const result = await getStudents({
        std_no: student_no,
      });

      return result[0];
    },
  },
  Student: {
    biodata: async (parent, args) => {
      try {
        const applicant_id = parent.applicant_id;
        const result = await getApplicant(applicant_id);
        return result;
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    student_marks: async (parent, args) => {
      try {
        const { study_yr, sem } = args;
        const results = await getStdResults({
          student_no: parent.student_no,
          study_yr,
          sem,
          limit: 50,
          start: 0,
        });

        // console.log("results", results);

        const resultsWithGrades = calculateGrades(
          results,
          parent.entry_acc_yr_title
        );
        return resultsWithGrades;
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    course_details: async (parent, args) => {
      try {
        const version_id = parent.course_version_id;
        let sql = `SELECT * FROM course_versions WHERE id = ?`;

        let values = [version_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the applicant details
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching version: " + error.message, {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    course: async (parent, args) => {
      try {
        const course_id = parent.course_id;
        let sql = `SELECT * FROM courses WHERE id = ?`;

        let values = [course_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the course
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching course: " + error.message, {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    enrollment_history: async (parent, args) => {
      try {
        const student_no = parent.student_no;

        // console.log("id", id);

        const results = await getStudentEnrollment({
          std_no: student_no,
        });

        // console.log("results", results);

        return results;
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },

    registration_history: async (parent, args) => {
      try {
        const student_no = parent.student_no;

        const results = await getStudentRegistrationHistory({
          std_no: student_no,
        });

        return results;
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    current_info: async (parent, args) => {
      // need the student number and the intake
      const { student_no, intake_id } = parent;

      try {
        let enrollment_status = null;
        let registration_status = null;

        // lets first get the most recent enrollment
        const enrollment_history = await getStudentEnrollment({
          std_no: student_no,
          exclude_dead_semesters: true,
        });

        const recentEn = enrollment_history[0];

        const [courseDetails] = await getCourse({
          course_id: parent.course_id,
          course_version_id: parent.course_version_id,
        });

        // now, lets proceed to the current university session based on student intake
        const [runningSem] = await getRunningSemesters({
          intake_id,
          limit: 1,
        });

        const student_enrollment = enrollment_history.filter(
          (enrollment) =>
            enrollment.acc_yr == runningSem.acc_yr_id &&
            enrollment.sem == runningSem.semester
        );

        console.log("student enrollment", student_enrollment);
        const nextEn = calculateNextEnrollment({
          enrollmentHistory: enrollment_history,
          currentAccYr: runningSem.acc_yr_title,
          courseDuration: courseDetails.course_duration,
          entryAccYr: parent.entry_acc_yr_title,
        });

        // console.log("next en", nextEn);

        const enrollment_types = await getEnrollmentTypes({
          enrollent_codes: nextEn.enrollment_status,
        });

        if (!student_enrollment[0]) {
          // student is not yet enrolled
          enrollment_status = `Not Enrolled in Sem ${runningSem.semester}`;
        } else {
          enrollment_status = "Enrolled";
        }

        // get student account balance
        const account_balance = await getStudentAccountBalance({
          student_no,
        });

        // get Student Registration status
        const existingRegistration = await getStudentRegistrationHistory({
          std_no: student_no,
          acc_yr: runningSem.acc_yr_id,
          sem: runningSem.semester,
        });

        const currentDate = new Date();

        if (existingRegistration.length === 0) {
          registration_status = "Not Registered";
        } else {
          const registration = existingRegistration[0]; // Assume we are checking the first registration
          if (registration.provisional) {
            const provisionalExpiry = new Date(registration.provisional_expiry); // Parse the expiry string into a Date object
            if (currentDate < provisionalExpiry) {
              registration_status = "Provisionally Registered";
            } else {
              registration_status = "Not Registered";
            }
          } else {
            registration_status = "Registered";
          }
        }

        const data = {
          recent_enrollment: recentEn,
          current_acc_yr: runningSem.acc_yr_title,
          acc_yr_id: runningSem.acc_yr_id,
          active_sem_id: runningSem.id,
          true_study_yr: nextEn.study_year,
          true_sem: nextEn.semester,
          enrollment_status,
          progress: "NORMAL",
          account_balance: account_balance || 0,
          registration_status,
          enrollment_types,
        };

        // console.log("the data", data);

        return data;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    invoices: async (parent, args) => {
      const invoices = await getStudentInvoices({
        student_no: parent.student_no,
      });

      return invoices;
    },
  },
  Mutation: {
    // registerApplicant: async (parent, args) => {
    //   const {
    //     surname,
    //     other_names,
    //     email,
    //     phone_no,
    //     nationality_id,
    //     date_of_birth,
    //     gender,
    //   } = args;

    //   // no repeatition of emails is allowed
    //   try {
    //     let sql = `SELECT applicants.*, otps.id as otp_id FROM applicants
    //     INNER JOIN otps ON otps.user_id = applicants.id
    //     WHERE email = ? OR phone_no = ?`;
    //     let values = [email, phone_no];

    //     const [results, fields] = await db.execute(sql, values);

    //     // console.log("results", results);

    //     if (results[0]) {
    //       throw new GraphQLError("User already exists!", {
    //         extensions: {
    //           http: { status: 400 },
    //         },
    //       });
    //     }

    //     //we need to send an otp to the applicant's email and phone number
    //     const otp_code = Math.floor(100000 + Math.random() * 900000);
    //     const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes

    //     const _data = {
    //       surname,
    //       other_names,
    //       email,
    //       phone_no,
    //       nationality_id,
    //       date_of_birth,
    //       gender,
    //     };

    //     const save_id = await saveData({
    //       table: "applicants",
    //       data: _data,
    //       id: results[0] ? results[0].id : null,
    //     });

    //     const _data2 = {
    //       user_id: save_id,
    //       otp_code: otp_code,
    //       expires_at: expiresAt,
    //     };

    //     await sendEmail(email, otp_code);

    //     await saveData({
    //       table: "otps",
    //       data: _data2,
    //       id: results[0] ? results[0].otp_id : null,
    //     });

    //     // insert the details in the database
    //     // let sql2 = `INSERT INTO applicants (
    //     //             surname,
    //     //             other_names,
    //     //             email,
    //     //             phone_no,
    //     //             nationality_id,
    //     //             date_of_birth,
    //     //             gender) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    //     // let values2 = [
    //     //   surname,
    //     //   other_names,
    //     //   email,
    //     //   phone_no,
    //     //   nationality_id,
    //     //   date_of_birth,
    //     //   gender,
    //     // ];

    //     // const [results2, fields2] = await db.execute(sql2, values2);

    //     // // insert the details in the database
    //     // let sql4 = `INSERT INTO otps (
    //     //     user_id,
    //     //     otp_code,
    //     //     expires_at
    //     //     ) VALUES (?, ?, ?)`;
    //     // let values4 = [results2.insertId, otp_code, expiresAt];

    //     // const [results4, fields4] = await db.execute(sql4, values4);

    //     // now let's return the registered user
    //     const applicant = await getApplicant(save_id);

    //     // console.log("results", results3);
    //     return applicant; // the registered applicant
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError(error.message);
    //   }
    // },
    // verifyOTP: async (parent, args) => {
    //   const { user_id, otp_code } = args;

    //   // check if otp is valid
    //   try {
    //     let sql = `SELECT * FROM otps WHERE user_id = ? AND otp_code = ? ORDER BY id DESC LIMIT 1`;
    //     let values = [user_id, otp_code];

    //     const [results, fields] = await db.execute(sql, values);

    //     if (!results[0]) {
    //       throw new GraphQLError("Invalid OTP!", {
    //         extensions: {
    //           http: { status: 400 },
    //         },
    //       });
    //     }

    //     // check if otp is expired
    //     const currentTimestamp = new Date();
    //     const expiresTimestamp = new Date(results[0].expires_at);

    //     if (currentTimestamp > expiresTimestamp) {
    //       throw new GraphQLError("OTP has expired!", {
    //         extensions: {
    //           http: { status: 400 },
    //         },
    //       });
    //     }

    //     // the otp is valid, update applicant to verified
    //     let sql2 = `UPDATE applicants SET is_verified = ? WHERE id = ?`;
    //     let values2 = [1, user_id];

    //     const [results2, fields2] = await db.execute(sql2, values2);

    //     // return the verified applicant
    //     const applicant = await getApplicant(user_id);

    //     // console.log("applicant", applicant);

    //     return applicant;
    //   } catch (error) {
    //     console.log("error", error);
    //     throw new GraphQLError(error.message);
    //   }
    // },
    // resendOTP: async (parent, args) => {
    //   const { user_id } = args;

    //   //we need to send an otp to the applicant's email and phone number
    //   const otp_code = Math.floor(100000 + Math.random() * 900000);
    //   const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes

    //   try {
    //     // first, the user must be a valid user
    //     const applicant = await getApplicant(user_id);

    //     if (!applicant) {
    //       throw new GraphQLError("Invalid user!", {
    //         extensions: {
    //           http: { status: 400 },
    //         },
    //       });
    //     }

    //     // insert the otp details in the database
    //     let sql4 = `INSERT INTO otps (
    //         user_id,
    //         otp_code,
    //         expires_at
    //         ) VALUES (?, ?, ?)`;
    //     let values4 = [user_id, otp_code, expiresAt];

    //     const [results4, fields4] = await db.execute(sql4, values4);

    //     await sendEmail(applicant.email, otp_code);

    //     return {
    //       success: "true",
    //       message: "OTP sent successfully!",
    //     };
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError(error.message);
    //   }
    // },
    // setApplicantPassword: async (parent, args) => {
    //   const { user_id, password } = args;
    //   const today = new Date();
    //   try {
    //     // first, the user must be a valid user
    //     const applicant = await getApplicant(user_id);

    //     if (!applicant) {
    //       throw new GraphQLError("Invalid user!", {
    //         extensions: {
    //           http: { status: 400 },
    //         },
    //       });
    //     }

    //     // generate a password hash for applicant
    //     const salt = await bcrypt.genSalt();
    //     const hashedPwd = await bcrypt.hash(password, salt);

    //     // insert the password details in the database
    //     let sql4 = `INSERT INTO applicant_pwds (
    //         user_id,
    //         password,
    //         created_on
    //         ) VALUES (?, ?, ?)`;
    //     let values4 = [user_id, hashedPwd, today];

    //     const [results4, fields4] = await db.execute(sql4, values4);

    //     // update the has_pwd flag in the applicants db
    //     let sql2 = `UPDATE applicants SET has_pwd = ? WHERE id = ?`;
    //     let values2 = [1, user_id];

    //     const [results2, fields2] = await db.execute(sql2, values2);

    //     // return the verified applicant
    //     const _applicant = await getApplicant(user_id);

    //     // console.log("applicant", applicant);

    //     return _applicant;
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError(error.message);
    //   }
    // },
    // applicantLogin: async (parent, args) => {
    //   const { mode, user_id, password } = args;
    //   let applicant = null;
    //   try {
    //     if (mode == "email") {
    //       // used email to login,
    //       // first, check if the email is valid
    //       let sql = `
    //       SELECT applicants.*,
    //       applicant_pwds.id AS pwd_id,
    //       applicant_pwds.password
    //       FROM applicants
    //       INNER JOIN applicant_pwds ON applicants.id = applicant_pwds.user_id
    //       WHERE email = ?
    //       `;
    //       let values = [user_id];

    //       const [results, fields] = await db.execute(sql, values);

    //       if (!results[0]) {
    //         throw new GraphQLError("Incorrect Email!", {
    //           extensions: {
    //             http: { status: 400 },
    //           },
    //         });
    //       }

    //       applicant = results[0];
    //     } else if (mode == "phone") {
    //       let sql = `
    //       SELECT applicants.*,
    //       applicant_pwds.id AS pwd_id,
    //       applicant_pwds.password
    //       FROM applicants
    //       INNER JOIN applicant_pwds ON applicants.id = applicant_pwds.user_id
    //       WHERE phone_no = ?`;
    //       let values = [user_id];

    //       const [results, fields] = await db.execute(sql, values);

    //       if (!results[0]) {
    //         throw new GraphQLError("Incorrect Phone Number!", {
    //           extensions: {
    //             http: { status: 400 },
    //           },
    //         });
    //       }

    //       applicant = results[0];
    //     } else {
    //       throw new GraphQLError("System Error, Try again later!", {
    //         extensions: {
    //           http: { status: 400 },
    //         },
    //       });
    //     }

    //     // email or password is valid, check the password
    //     const auth = await bcrypt.compare(password, applicant.password);

    //     if (auth) {
    //       return applicant;
    //     } else {
    //       throw new GraphQLError("Incorrect Password!", {
    //         extensions: {
    //           http: { status: 400 },
    //         },
    //       });
    //     }
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError(error.message);
    //   }
    // },
    // changeApplicantPassword: async (parent, args) => {
    //   const { user_id, old_password, new_password } = args;
    //   // console.log("args", args);
    //   const today = new Date();
    //   try {
    //     // first, the user must be a valid user
    //     let sql = `SELECT
    //     applicants.*,
    //     applicant_pwds.id AS pwd_id,
    //     applicant_pwds.password
    //     FROM applicants
    //     INNER JOIN applicant_pwds ON applicants.id = applicant_pwds.user_id
    //     WHERE applicants.id = ?`;
    //     let values = [user_id];

    //     const [results, fields] = await db.execute(sql, values);

    //     // console.log("results", results);

    //     let applicant = results[0];

    //     if (!applicant) {
    //       throw new GraphQLError("Invalid user!", {
    //         extensions: {
    //           http: { status: 400 },
    //         },
    //       });
    //     }

    //     // then check if the old password is valid
    //     const auth = await bcrypt.compare(old_password, applicant.password);

    //     if (auth) {
    //       // now lets change the password
    //       // generate a password hash for the new password
    //       const salt = await bcrypt.genSalt();
    //       const hashedPwd = await bcrypt.hash(new_password, salt);

    //       // insert the password details in the database
    //       let sql4 = `UPDATE applicant_pwds set password = ?, changed_on = ?, changed_by = ? WHERE  id = ?`;
    //       let values4 = [hashedPwd, today, user_id, applicant.pwd_id];

    //       const [results4, fields4] = await db.execute(sql4, values4);

    //       return {
    //         success: "true",
    //         message: "Password Changed Successfully",
    //       };
    //     } else {
    //       throw new GraphQLError("Incorrect Password!", {
    //         extensions: {
    //           http: { status: 400 },
    //         },
    //       });
    //     }
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError(error.message);
    //   }
    // },
    // saveApplicantBioData: async (parent, args) => {
    //   const {
    //     applicant_id,
    //     form_no,
    //     admissions_id,
    //     salutation,
    //     district_of_birth,
    //     district_of_origin,
    //     religion,
    //     marital_status,
    //     nin,
    //     place_of_residence,
    //     completed_form_sections,
    //   } = args;

    //   // first, we need to check for the existence of the applicant
    //   try {
    //     const applicant = await getApplicant(applicant_id);

    //     if (!applicant) {
    //       throw new GraphQLError("Invalid User!", {
    //         extensions: {
    //           http: { status: 400 },
    //         },
    //       });
    //     }

    //     // update the biodata of the applicant
    //     let sql2 = `UPDATE applicants SET
    //       salutation_id = ?,
    //       district_of_birth = ?,
    //       district_of_origin = ?,
    //       religion = ?,
    //       marital_status = ?,
    //       nin = ?,
    //       place_of_residence = ?
    //       WHERE id = ?`;

    //     let values2 = [
    //       salutation,
    //       district_of_birth,
    //       district_of_origin,
    //       religion,
    //       marital_status,
    //       nin,
    //       place_of_residence,
    //       applicant_id,
    //     ];

    //     const [results2, fields2] = await db.execute(sql2, values2);

    //     const uniqueFormNumber = generateFormNumber();
    //     const today = new Date();
    //     const status = "pending";

    //     // lets see if the form is already created
    //     let sql4 = `SELECT * FROM applications WHERE form_no = ?`;
    //     let values4 = [form_no];

    //     const [results4, fields4] = await db.execute(sql4, values4);

    //     // console.log("results566", results4);

    //     if (!results4[0]) {
    //       // now, lets create the form for the applicant
    //       // insert the details in the database
    //       let sql3 = `INSERT INTO applications (
    //       applicant_id,
    //       form_no,
    //       admissions_id,
    //       creation_date,
    //       status,
    //       completed_section_ids
    //       ) VALUES (?, ?, ?, ?, ?, ?)`;

    //       let values3 = [
    //         applicant_id,
    //         uniqueFormNumber,
    //         admissions_id,
    //         today,
    //         status,
    //         completed_form_sections,
    //       ];

    //       const [results3, fields3] = await db.execute(sql3, values3);

    //       // console.log("results", results3);
    //     } else {
    //       // if the application exists, just update the form section ids
    //       let sql = `UPDATE applications SET completed_section_ids = ? WHERE id = ?`;

    //       let values = [completed_form_sections, results4[0].id];

    //       const [results, fields] = await db.execute(sql, values);
    //     }

    //     return {
    //       success: "true",
    //       message: "Biodata saved Successfully",
    //     };
    //   } catch (error) {
    //     console.log("error", error.message);
    //     throw new GraphQLError(error.message);
    //   }
    // },
    saveNewStudent: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const {
        student_no,
        reg_no,
        surname,
        other_names,
        gender,
        district,
        email,
        phone_no,
        entry_acc_yr,
        entry_study_yr,
        nationality,
        sponsorship,
        guardian_name,
        guardian_contact,
        billing_nationality,
        hall_of_attachment,
        hall_of_residence,
        course_id,
        course_version_id,
        intake_id,
        campus_id,
        study_yr,
        current_sem,
        residence_status,
        study_time_id,
        completed,
      } = args.payload;

      // console.log("payload", args.payload);

      let connection = await db.getConnection();

      try {
        connection.beginTransaction();

        const students = await getStudents({
          campus_id,
          intake_id,
          acc_yr_id: entry_acc_yr,
          course_version_id,
          sic: true,
          std_no: student_no,
          get_course_details: true,
        });

        if (students.length > 0) {
          throw new GraphQLError("Student already exists");
        }

        // create applicant
        const applicant_data = {
          surname,
          other_names,
          email,
          phone_no,
          nationality_id: nationality,
          gender,
          is_verified: 1,
          has_pwd: 1,
          created_at: new Date(),
          place_of_residence: district,
          permanent_district: district,
        };

        // console.log("applicant data", applicant_data);

        const save_id = await saveData({
          table: "applicants",
          data: applicant_data,
          id: null,
        });

        // console.log("save id", save_id);

        // create student
        const student_data = {
          student_no,
          registration_no: reg_no,
          applicant_id: save_id,
          course_id,
          campus_id,
          course_version_id,
          study_time_id,
          intake_id,
          is_std_verified: 1,
          is_resident: residence_status,
          hall_of_residence: hall_of_residence,
          entry_study_yr,
          entry_acc_yr,
          is_on_sponsorship: sponsorship,
          added_by: user_id,
          creation_date: new Date(),
        };

        const save_id2 = await saveData({
          table: "students",
          data: student_data,
          id: null,
        });

        const enrollment_token = await generateEnrollmentToken();

        let enrollment_status_id = 1;
        if (entry_study_yr == 1 && current_sem == 1) {
          // new_student
          enrollment_status_id = 1;
        } else if (completed == 1) {
          // completed
          enrollment_status_id = 3;
        } else {
          // continuing
          enrollment_status_id = 2;
        }
        // create enrollment records
        const enrollment_data = {
          enrollment_token,
          stdno: student_no,
          acc_yr: entry_acc_yr,
          study_yr,
          sem: current_sem,
          enrollment_status_id,
          datetime: new Date(),
          enrolled_by: user_id,
          // session_id: ,
          invoiced: 0,
          // tuition_invoice_no: String,
          // functional_invoice_no: String,
          // enrollment_status: EnrollmentStatus,
        };

        const save_id3 = await saveData({
          table: "students_enrollment",
          data: enrollment_data,
          id: null,
        });

        connection.commit();

        return {
          success: "true",
          message: "Student added successfully",
        };
      } catch (error) {
        connection.rollback();
        throw new GraphQLError(error.message);
      } finally {
        if (connection) {
          connection.release();
        }
      }
    },
    saveStudentData: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const {
        student_no,
        applicant_id,
        reg_no,
        surname,
        other_names,
        gender,
        district,
        email,
        phone_no,
        entry_acc_yr,
        entry_study_yr,
        nationality,
        sponsorship,
        hall_of_residence,
        course_id,
        course_version_id,
        intake_id,
        campus_id,
        residence_status,
        study_time_id,
        completed,
      } = args.payload;

      // console.log("payload", args.payload);
      let connection = await db.getConnection();

      try {
        connection.beginTransaction();

        // create applicant
        // const applicant_data = {
        //   surname,
        //   other_names,
        //   email,
        //   phone_no,
        //   nationality_id: nationality,
        //   gender,
        //   is_verified: 1,
        //   has_pwd: 1,
        //   created_at: new Date(),
        //   place_of_residence: district,
        //   permanent_district: district,
        // };

        // console.log("applicant data", applicant_data);

        // const save_id = await saveData({
        //   table: "applicants",
        //   data: applicant_data,
        //   id: applicant_id,
        // });

        // console.log("save id", save_id);

        // create student
        const student_data = {
          student_no,
          registration_no: reg_no,
          applicant_id,
          course_id,
          campus_id,
          course_version_id,
          study_time_id,
          intake_id,
          is_std_verified: 1,
          // is_resident: residence_status || null,
          hall_of_residence: hall_of_residence || null,
          entry_study_yr,
          entry_acc_yr,
          // is_on_sponsorship: sponsorship,
          added_by: user_id,
          creation_date: new Date(),
        };

        // console.log("student data", student_data);

        const save_id2 = await saveData({
          table: "students",
          data: student_data,
          id: student_no,
          idColumn: "student_no",
        });

        connection.commit();

        return {
          success: "true",
          message: "Student details saved successfully",
        };
      } catch (error) {
        connection.rollback();
        throw new GraphQLError(error.message);
      } finally {
        if (connection) {
          connection.release();
        }
      }
    },
    uploadStudents: async (parent, args, context) => {
      const BATCH_SIZE = 500;
      const user_id = context.req.user.id;

      let connection;
      connection = await db.getConnection();

      try {
        // Begin a database transaction
        await connection.beginTransaction();

        // Divide the payload into chunks
        const studentChunks = chunk(args.payload, BATCH_SIZE);

        // console.log("student chunks", studentChunks);

        for (const chunk of studentChunks) {
          const campusIds = {};
          const studyTimeIds = {};
          const intakeIds = {};
          const nationalityIds = {};
          const enrollmentStatusIds = {};

          // Pre-fetch or create references in bulk to reduce database calls
          for (const student of chunk) {
            // Fetch or create campus, study_time, intake, etc.
            campusIds[student.campus] =
              campusIds[student.campus] ||
              (await fetchOrCreateRecord({
                table: "campuses",
                field: "campus_title",
                value: student.campus,
                user_id,
              }));

            studyTimeIds[student.study_time] =
              studyTimeIds[student.study_time] ||
              (await fetchOrCreateRecord({
                table: "study_times",
                field: "study_time_title",
                value: student.study_time,
                user_id,
              }));

            intakeIds[student.intake] =
              intakeIds[student.intake] ||
              (await fetchOrCreateRecord({
                table: "intakes",
                field: "intake_title",
                value: student.intake,
                user_id,
              }));

            nationalityIds[student.nationality] =
              nationalityIds[student.nationality] ||
              (await fetchOrCreateRecord({
                table: "nationalities",
                field: "nationality_title",
                value: student.nationality,
                user_id,
              }));

            enrollmentStatusIds[student.enrollment_status] =
              enrollmentStatusIds[student.enrollment_status] ||
              (await fetchOrCreateEnrollmentStatus(student.enrollment_status));
          }

          // Prepare bulk data for inserts/updates
          const applicantsData = [];
          const studentsData = [];
          const enrollmentData = [];
          const registrationData = [];

          for (const student of chunk) {
            const [surname, ...other_names] = student.name.split(" ");
            const courses = await getCourse({
              course_code: student.progcode,
            });

            const course = courses[courses.length - 1];

            if (!course) {
              throw new GraphQLError("Course not found: " + student.progcode);
            }

            // Create applicant data
            const applicant_data = {
              surname,
              other_names: other_names.join(" "),
              email: student.email,
              phone_no: student.telno,
              nationality_id: nationalityIds[student.nationality],
              gender: student.sex,
              is_verified: 1,
              has_pwd: 1,
              place_of_residence: "",
              permanent_district: "",
              created_at: new Date(),
            };

            const existingStds = await getStudents({
              campus_id: campusIds[student.campus],
              intake_id: intakeIds[student.intake],
              // acc_yr_id: enrtry_acc_yr_id,
              // course_version_id,
              sic: true,
              std_no: student.stdno,
              get_course_details: true,
            });

            // if (students.length > 0) {
            //   throw new GraphQLError("Student already exists: " + student.stdno);
            // }

            const save_applicant_id = await saveData({
              table: "applicants",
              data: applicant_data,
              // uniqueField: ""
              id: existingStds.length > 0 ? existingStds[0].applicant_id : null,
            });

            // console.log("existing ", existingStds);

            if (existingStds[0]) {
              // lets exclude the course, if the student is already in the system
              studentsData.push({
                student_no: student.stdno,
                registration_no: student.regno,
                course_id: existingStds[0].course_id,
                applicant_id: save_applicant_id,
                course_version_id: existingStds[0].course_version_id,
                campus_id: campusIds[student.campus],
                intake_id: intakeIds[student.intake],
                study_time_id: studyTimeIds[student.study_time],
                is_std_verified: 1,
                is_resident:
                  student.residence_status === "NON-RESIDENT" ? 0 : 1,
                hall_of_residence: student.hall_of_residence,
                entry_study_yr: 1,
                entry_acc_yr: await fetchOrCreateRecord({
                  table: "acc_yrs",
                  field: "acc_yr_title",
                  value: student.entry_ac_yr,
                  user_id,
                }),
                is_on_sponsorship: student.sponsorship === "PRIVATE" ? 0 : 1,
                added_by: user_id,
                creation_date: new Date(),
              });
            } else {
              studentsData.push({
                student_no: student.stdno,
                registration_no: student.regno,
                course_id: course.id,
                applicant_id: save_applicant_id,
                course_version_id: course.course_version_id,
                campus_id: campusIds[student.campus],
                intake_id: intakeIds[student.intake],
                study_time_id: studyTimeIds[student.study_time],
                is_std_verified: 1,
                is_resident:
                  student.residence_status === "NON-RESIDENT" ? 0 : 1,
                hall_of_residence: student.hall_of_residence,
                entry_study_yr: 1,
                entry_acc_yr: await fetchOrCreateRecord({
                  table: "acc_yrs",
                  field: "acc_yr_title",
                  value: student.entry_ac_yr,
                  user_id,
                }),
                is_on_sponsorship: student.sponsorship === "PRIVATE" ? 0 : 1,
                added_by: user_id,
                creation_date: new Date(),
              });
            }

            // Prepare enrollment data
            enrollmentData.push({
              enrollment_token: student.enrollment_token,
              stdno: student.stdno,
              acc_yr: await fetchOrCreateRecord({
                table: "acc_yrs",
                field: "acc_yr_title",
                value: student.accyr,
                user_id,
              }),
              study_yr: student.study_yr,
              sem: student.sem,
              enrollment_status_id:
                enrollmentStatusIds[student.enrollment_status],
              datetime: new Date(),
              enrolled_by: user_id,
            });

            // Prepare registration data
            if (student.reg_status === "Registered") {
              registrationData.push({
                student_no: student.stdno,
                registration_token: student.registration_token,
                enrollment_token: student.enrollment_token,
                acc_yr_id: await fetchOrCreateRecord({
                  table: "acc_yrs",
                  field: "acc_yr_title",
                  value: student.accyr,
                  user_id,
                }),
                study_yr: student.study_yr,
                sem: student.sem,
                provisional: student.provisional === "false" ? 0 : 1,
                de_registered: 0,
                registered_by: user_id,
                date: new Date(),
              });
            }
          }

          // console.log("applicants", applicantsData);
          // console.log("students", studentsData);
          // console.log("enrollments", enrollmentData);
          // console.log("registrations", registrationData);

          // Insert data in bulk
          await saveDataWithOutDuplicates({
            table: "students",
            data: studentsData,
            uniqueField: "student_no",
            // id: null,
          });
          await saveDataWithOutDuplicates({
            table: "students_enrollment",
            data: enrollmentData,
            uniqueField: "enrollment_token",
            // id: null,
          });

          if (registrationData.length > 0) {
            await saveDataWithOutDuplicates({
              table: "students_registration",
              data: registrationData,
              uniqueField: "enrollment_token",
              // id: null,
            });
          }
        }

        // Commit the transaction after processing all chunks
        await connection.commit();

        return {
          success: true,
          message: "Students uploaded successfully",
        };
      } catch (error) {
        await connection.rollback();
        console.log("errror", error);

        throw new GraphQLError(error.message);
      } finally {
        await connection.release();
      }
    },
    uploadStudentsV2: async (parent, args, context) => {
      const BATCH_SIZE = 500;
      const user_id = context.req.user.id;

      let connection;
      connection = await db.getConnection();

      try {
        // Begin a database transaction
        await connection.beginTransaction();

        // Divide the payload into chunks
        const studentChunks = chunk(args.payload, BATCH_SIZE);

        // console.log("student chunks", studentChunks);

        for (const chunk of studentChunks) {
          const campusIds = {};
          const studyTimeIds = {};
          const intakeIds = {};
          const nationalityIds = {};
          const enrollmentStatusIds = {};

          // Pre-fetch or create references in bulk to reduce database calls
          for (const student of chunk) {
            // Fetch or create campus, study_time, intake, etc.
            campusIds[student.campus] =
              campusIds[student.campus] ||
              (await fetchOrCreateRecord({
                table: "campuses",
                field: "campus_title",
                value: student.campus,
                user_id,
              }));

            studyTimeIds[student.study_time] =
              studyTimeIds[student.study_time] ||
              (await fetchOrCreateRecord({
                table: "study_times",
                field: "study_time_title",
                value: student.study_time,
                user_id,
              }));

            intakeIds[student.intake] =
              intakeIds[student.intake] ||
              (await fetchOrCreateRecord({
                table: "intakes",
                field: "intake_title",
                value: student.intake,
                user_id,
              }));

            nationalityIds[student.nationality] =
              nationalityIds[student.nationality] ||
              (await fetchOrCreateRecord({
                table: "nationalities",
                field: "nationality_title",
                value: student.nationality,
                user_id,
              }));
          }

          // Prepare bulk data for inserts/updates
          const applicantsData = [];
          const studentsData = [];
          const enrollmentData = [];
          const registrationData = [];

          for (const student of chunk) {
            const courses = await getCourse({
              course_code: student.progcode,
            });

            // console.log("course", course);

            const course = courses[courses.length - 1];

            if (!course) {
              throw new GraphQLError("Course not found: " + student.progcode);
            }

            // console.log("applicant", applicant_data);

            const existingStds = await getStudents({
              campus_id: campusIds[student.campus],
              intake_id: intakeIds[student.intake],
              // acc_yr_id: enrtry_acc_yr_id,
              // course_version_id,
              sic: true,
              std_no: student.stdno,
              get_course_details: true,
            });

            // Create applicant data
            const applicant_data = {
              surname: student.surname,
              other_names: student.other_names,
              email: student.email ? student.email : "",
              phone_no: student.telno ? student.telno : "",
              nationality_id: nationalityIds[student.nationality],
              gender: student.sex,
              is_verified: 1,
              has_pwd: 1,
              place_of_residence: "",
              permanent_district: "",
              created_at: new Date(),
              date_of_birth: new Date(student.dob_sdate),
              district_of_birth: student.home_district,
            };

            // if (students.length > 0) {
            //   throw new GraphQLError("Student already exists: " + student.stdno);
            // }

            const save_applicant_id = await saveData({
              table: "applicants",
              data: applicant_data,
              // uniqueField: ""
              id: existingStds.length > 0 ? existingStds[0].applicant_id : null,
            });

            // console.log("course", {
            //   course: course,
            //   std: student,
            // });

            const course_version = await getCourseVersionDetails({
              course_id: course.id,
              course_version: student.progversion,
            });

            if (!course) {
              throw new GraphQLError(
                "Course version not found: " +
                  student.progversion +
                  " for course: " +
                  student.progcode
              );
            }

            // console.log("existing ", existingStds);

            studentsData.push({
              student_no: student.stdno,
              registration_no: student.regno,
              course_id: course.id,
              course_version_id: course_version.id,
              applicant_id: save_applicant_id,
              campus_id: campusIds[student.campus],
              intake_id: intakeIds[student.intake],
              study_time_id: studyTimeIds[student.study_time],
              is_std_verified: 1,
              is_resident: student.residence_status === "NON-RESIDENT" ? 0 : 1,
              hall_of_residence: student.hall_of_residence || "",
              entry_study_yr: 1,
              entry_acc_yr: await fetchOrCreateRecord({
                table: "acc_yrs",
                field: "acc_yr_title",
                value: student.entry_ac_yr,
                user_id,
              }),
              is_on_sponsorship: student.sponsorship === "PRIVATE" ? 0 : 1,
              added_by: user_id,
              creation_date: new Date(),
              tredumo_admitted: 0,
              imported_record: 1,
              sponsorship: student.sponsorship,
              form_no: student.admissions_form_no,
            });
          }

          // console.log("applicants", applicantsData);
          // console.log("students", studentsData);
          // console.log("enrollments", enrollmentData);
          // console.log("registrations", registrationData);

          // Insert data in bulk
          await saveDataWithOutDuplicates({
            table: "students",
            data: studentsData,
            uniqueField: "student_no",
            // id: null,
          });
        }

        // Commit the transaction after processing all chunks
        await connection.commit();

        return {
          success: true,
          message: "Students uploaded successfully",
        };
      } catch (error) {
        await connection.rollback();

        throw new GraphQLError(error.message);
      } finally {
        await connection.release();
      }
    },
    studentPortalLogin: async (parent, args) => {
      try {
        const { user_id, password } = args;

        // Check if the student exists
        const [student] = await getStudents({ std_no: user_id });

        if (!student) throw new GraphQLError("Invalid student ID or password");

        // Query for the student's login credentials
        const sql =
          "SELECT * FROM student_logins WHERE deleted = 0 AND student_no = ?";
        const [result] = await db.execute(sql, [user_id]);

        let token;

        if (result.length > 0) {
          // If the student has already created a password, validate it
          const validPassword = await bcrypt.compare(password, result[0].pwd);
          if (!validPassword)
            throw new GraphQLError("Invalid student ID or password");

          // Generate a token for an existing user
          token = jwt.sign(
            {
              student_no: student.student_no,
            },
            PORTAL_PRIVATE_KEY,
            { expiresIn: "1d" }
          );
        } else {
          // If no password exists, the password must be the student no -> generate a token requiring a password change

          const validPassword = password == student.student_no ? true : false;
          if (!validPassword)
            throw new GraphQLError("Invalid student ID or password");

          const applicant = await getApplicant(student.applicant_id);

          token = jwt.sign(
            {
              student_no: student.student_no,
              change_password: true,
              validate_credentials: true,
              email: applicant.email,
              phone_no: applicant.phone_no,
            },
            PORTAL_PRIVATE_KEY,
            { expiresIn: "1d" }
          );
        }

        return { token };
      } catch (error) {
        // console.error("Login Error:", error);
        throw new GraphQLError(error.message);
      }
    },
    changeStdPwd: async (parent, args, context) => {
      try {
        const stdno = context.req.user.student_no;
        const { password } = args;

        const SALT_ROUNDS = 10;
        const pwdHash = await bcrypt.hash(password, SALT_ROUNDS);

        const [stdLogin] = await getStudentLogin({
          student_no: stdno,
        });

        if (!stdLogin) {
          const data = {
            student_no: stdno,
            pwd: pwdHash,
            created_on: new Date(),
          };

          await saveData({
            table: "student_logins",
            data,
            id: null,
          });
        } else {
          const data2 = {
            pwd: pwdHash,
          };

          await saveData({
            table: "student_logins",
            data: data2,
            id: stdno,
            idColumn: "student_no",
          });
        }

        return {
          success: "true",
          message: "Password Changed Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    saveStdCredentials: async (parent, args, context) => {
      try {
        const stdno = context.req.user.student_no;
        const { email, phone_no } = args;

        const [std] = await getStudents({
          std_no: stdno,
        });

        if (!std)
          throw new GraphQLError("Internal Server Error, Try again later");

        const data = {
          email,
          phone_no,
        };

        await saveData({
          table: "applicants",
          data,
          id: std.applicant_id,
        });

        return {
          success: "true",
          message: "Student Credentials Saved Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    studentSemesterEnrollment: async (parent, args, context) => {
      try {
        const stdno = context.req.user.student_no;
        const enrollmentToken = generateEnrollmentToken();
        let invoiced = false;
        let tuition_invoice_no = null;
        let functional_invoice_no = null;
        const { acc_yr_id, study_yr, sem, enrollment_status_id } = args.payload;

        // check if the student fully registered for the the prev sem
        const [prevEnrollment] = await getStudentEnrollment({
          std_no: stdno,
          limit: 1,
        });

        if (prevEnrollment) {
          // check for the registration based on the enrollment
          const [prevReg] = await getStudentRegistrationHistory({
            std_no: stdno,
            enrollment_token: prevEnrollment.enrollment_token,
            limit: 1,
          });

          if (!prevReg)
            throw new GraphQLError(
              "Error occurred during enrollment, Please contact the administrative help desk to enroll!"
            );
        }

        // check if student is already enrolled in the given study_yr and sem
        const existingEnrollment = await getStudentEnrollment({
          std_no: stdno,
          study_yr,
          sem,
          enrollment_status_id,
        });

        if (existingEnrollment.length > 0)
          throw new GraphQLError(
            "Student is already enrolled in the given semester and study yr"
          );

        // i need the enrollment status details to figure out where to exempt tuition or not
        const [enrollmentStatus] = await getEnrollmentTypes({
          id: enrollment_status_id,
        });

        if (!enrollmentStatus) {
          throw new GraphQLError("Invalid/Unknown status id!");
        }

        if (!enrollmentStatus.exempt_tuition) {
          // generate a tuition invoice
          const tuition_invoice = await createTuitionInvoiceV2({
            student_no: stdno,
            academic_year: acc_yr_id,
            study_year: study_yr,
            semester: sem,
          });
          tuition_invoice_no = tuition_invoice;
          invoiced = true;
        }

        if (!enrollmentStatus.exempt_functional) {
          // generate a functional invoice
          const functional_invoice = await createFunctionalInvoiceV2({
            student_no: stdno,
            academic_year: acc_yr_id,
            study_year: study_yr,
            semester: sem,
          });
          functional_invoice_no = functional_invoice;
        }

        const data = {
          enrollment_token: enrollmentToken,
          stdno,
          acc_yr: acc_yr_id,
          study_yr,
          sem,
          enrollment_status_id,
          datetime: new Date(),
          enrolled_by: stdno,
          enrolled_by_type: "student",
          next_sem: sem == 1 ? 2 : 1,
          tuition_invoice_no: tuition_invoice_no,
          functional_invoice_no: functional_invoice_no,
          invoiced,
        };

        // console.log("enrollment", data);

        await saveData({
          table: "students_enrollment",
          data,
          id: null,
        });

        return {
          success: "true",
          message: "Enrollment details saved successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default studentResolvers;
