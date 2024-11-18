import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import sendEmail from "../../utilities/emails/email-otp.js";
import bcrypt from "bcrypt";
import generateFormNumber from "../../utilities/generateApplicationFormNo.js";
import { getAllRunningAdmissions } from "../running_admissions/resolvers.js";
import saveData from "../../utilities/db/saveData.js";
import { getRunningSemesters } from "../academic_schedule/resolvers.js";
import { getStudentEnrollment } from "../student_enrollment/resolvers.js";
import {
  findDeadSemesters,
  generateSemesterList,
  generateSemesterListForNormalProgress,
} from "../../utilities/calculateEnrollment.js";
import { getStudentInvoices } from "../invoice/resolvers.js";
import { getStudentRegistrationHistory } from "../student_registration/resolvers.js";

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

export const getStudents = async ({
  std_id,
  campus_id,
  intake_id,
  acc_yr_id,
  course_version_id,
  sic,
  std_no,
  get_course_details = false,
}) => {
  try {
    let where = "";
    let extra_select = "";
    let extra_join = "";
    let values = [];

    if (std_no) {
      where += " AND students.student_no = ?";
      values.push(std_no);
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
      where += " AND students.intake_id = ?";
      values.push(intake_id);
    }

    if (course_version_id) {
      where += " AND students.course_version_id = ?";
      values.push(course_version_id);
    }

    if (get_course_details) {
      extra_join += " LEFT JOIN courses ON courses.id = students.course_id";
      extra_select += " ,courses.course_duration, courses.level";
    }

    let sql = `SELECT students.*, intakes.intake_title, acc_yrs.acc_yr_title as entry_acc_yr_title, campuses.campus_title, study_times.study_time_title ${extra_select} 
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

        // will later cater for when there is no running sem
        // if (!running_semesters[0]) return

        // now lets check if the student has any record of enrollment with the obtained active_sem id
        const student_enrollment = await getStudentEnrollment({
          std_no: student_no,
          active_sem_id: running_semesters[0].id,
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
        let sql = `SELECT students_enrollment.*, acc_yrs.acc_yr_title
        FROM students_enrollment 
        LEFT JOIN acc_yrs ON acc_yrs.id = students_enrollment.acc_yr
        WHERE students_enrollment.deleted = 0 AND stdno = ? AND students_enrollment.enrollment_status_id != ?
        ORDER BY id DESC LIMIT 1`;
        let values = [student_no, 6];
        const [results, fields] = await db.execute(sql, values);
        // console.log("recent enrollment", results);
        const recentEn = results[0];

        const student = await getStudents({
          std_no: student_no,
          get_course_details: true,
        });

        // console.log("the student", student);

        if (!student[0]) throw new GraphQLError(`Failed to get student...`);

        // now, lets proceed to the current university session based on student intake
        const sems = await getRunningSemesters({
          intake_id,
        });

        const runningSem = sems[0];

        // console.log("running", sems);

        const all_student_enrollment = await getStudentEnrollment({
          std_no: student_no,
        });

        // console.log("all", all_student_enrollment);

        const student_enrollment = all_student_enrollment.filter(
          (enrollment) => enrollment.active_sem_id == runningSem.id
        );

        let activeSem;
        let expectedSemesters;

        // based on student progress, we might need to create a different path for the student
        // let's first look for any dead sem in this student's records
        const deadSem = all_student_enrollment.filter(
          (enrollment) => enrollment.enrollment_status_id == "6"
        );

        // console.log("has dead sem", deadSem);

        let enrollmentHist = await getStudentEnrollment({
          std_no: student_no,
          exclude_dead_semesters: 1,
        });

        if (deadSem[0]) {
          activeSem = {
            acc_yr_title: runningSem.acc_yr_title,
            semester:
              all_student_enrollment.length > 0
                ? all_student_enrollment[0].next_sem
                : 1,
          };
          // expectedSemesters = generateSemesterList(
          //   all_student_enrollment[0].acc_yr_title,
          //   student[0].course_duration,
          //   all_student_enrollment[0].study_yr
          // );

          expectedSemesters = generateSemesterList(
            runningSem.acc_yr_title,
            student[0].course_duration,
            enrollmentHist[0].study_yr,
            all_student_enrollment.length > 0
              ? all_student_enrollment[0].next_sem
              : 1,
            enrollmentHist[0].datetime
          );

          // expectedSemesters = generateSemesterListForNormalProgress(
          //   enrollmentHist[enrollmentHist.length - 1].acc_yr_title,
          //   student[0].course_duration,
          //   enrollmentHist[enrollmentHist.length - 1].study_yr
          // );
        } else {
          expectedSemesters = generateSemesterListForNormalProgress(
            student[0].entry_acc_yr_title,
            student[0].course_duration
          );
          activeSem = runningSem;
        }

        // console.log("active sem", activeSem);

        const { deadSemesters, nextEnrollment } = findDeadSemesters(
          enrollmentHist,
          expectedSemesters,
          activeSem
        );

        // console.log("history", enrollmentHist);
        // console.log("expected sems", expectedSemesters);
        // console.log("dead sems", deadSemesters);
        // console.log("next enroll", nextEnrollment);
        // console.log("next sem", all_student_enrollment[0]);

        if (!student_enrollment[0]) {
          // student is not yet enrolled
          enrollment_status = `Not Enrolled in Sem ${
            deadSem[0]
              ? all_student_enrollment[0]?.next_sem
              : enrollmentHist.length > 0
              ? runningSem.semester
              : nextEnrollment.semester
          }`;
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
          study_yr: nextEnrollment?.studyYear,
          sem: deadSem[0]
            ? all_student_enrollment[0]?.next_sem
            : enrollmentHist.length > 0
            ? runningSem.semester
            : nextEnrollment.semester,
        });

        if (existingRegistration.length == 0) {
          registration_status = "Not Registered";
        } else {
          registration_status = "Registered";
        }

        const data = {
          recent_enrollment: recentEn,
          current_acc_yr: runningSem.acc_yr_title,
          acc_yr_id: runningSem.acc_yr_id,
          active_sem_id: runningSem.id,
          true_sem: deadSem[0]
            ? all_student_enrollment[0]?.next_sem
            : enrollmentHist.length > 0
            ? runningSem.semester
            : nextEnrollment.semester,
          true_study_yr: nextEnrollment?.studyYear,
          enrollment_status,
          progress:
            deadSem.length > 0
              ? `BEHIND BY ${deadSem.length} SEM(S)`
              : "NORMAL",
          account_balance: account_balance || 0,
          registration_status,
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
    registerApplicant: async (parent, args) => {
      const {
        surname,
        other_names,
        email,
        phone_no,
        nationality_id,
        date_of_birth,
        gender,
      } = args;

      // no repeatition of emails is allowed
      try {
        let sql = `SELECT applicants.*, otps.id as otp_id FROM applicants
        INNER JOIN otps ON otps.user_id = applicants.id
        WHERE email = ? OR phone_no = ?`;
        let values = [email, phone_no];

        const [results, fields] = await db.execute(sql, values);

        // console.log("results", results);

        if (results[0]) {
          throw new GraphQLError("User already exists!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }

        //we need to send an otp to the applicant's email and phone number
        const otp_code = Math.floor(100000 + Math.random() * 900000);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes

        const _data = {
          surname,
          other_names,
          email,
          phone_no,
          nationality_id,
          date_of_birth,
          gender,
        };

        const save_id = await saveData({
          table: "applicants",
          data: _data,
          id: results[0] ? results[0].id : null,
        });

        const _data2 = {
          user_id: save_id,
          otp_code: otp_code,
          expires_at: expiresAt,
        };

        await sendEmail(email, otp_code);

        await saveData({
          table: "otps",
          data: _data2,
          id: results[0] ? results[0].otp_id : null,
        });

        // insert the details in the database
        // let sql2 = `INSERT INTO applicants (
        //             surname,
        //             other_names,
        //             email,
        //             phone_no,
        //             nationality_id,
        //             date_of_birth,
        //             gender) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        // let values2 = [
        //   surname,
        //   other_names,
        //   email,
        //   phone_no,
        //   nationality_id,
        //   date_of_birth,
        //   gender,
        // ];

        // const [results2, fields2] = await db.execute(sql2, values2);

        // // insert the details in the database
        // let sql4 = `INSERT INTO otps (
        //     user_id,
        //     otp_code,
        //     expires_at
        //     ) VALUES (?, ?, ?)`;
        // let values4 = [results2.insertId, otp_code, expiresAt];

        // const [results4, fields4] = await db.execute(sql4, values4);

        // now let's return the registered user
        const applicant = await getApplicant(save_id);

        // console.log("results", results3);
        return applicant; // the registered applicant
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    verifyOTP: async (parent, args) => {
      const { user_id, otp_code } = args;

      // check if otp is valid
      try {
        let sql = `SELECT * FROM otps WHERE user_id = ? AND otp_code = ? ORDER BY id DESC LIMIT 1`;
        let values = [user_id, otp_code];

        const [results, fields] = await db.execute(sql, values);

        if (!results[0]) {
          throw new GraphQLError("Invalid OTP!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }

        // check if otp is expired
        const currentTimestamp = new Date();
        const expiresTimestamp = new Date(results[0].expires_at);

        if (currentTimestamp > expiresTimestamp) {
          throw new GraphQLError("OTP has expired!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }

        // the otp is valid, update applicant to verified
        let sql2 = `UPDATE applicants SET is_verified = ? WHERE id = ?`;
        let values2 = [1, user_id];

        const [results2, fields2] = await db.execute(sql2, values2);

        // return the verified applicant
        const applicant = await getApplicant(user_id);

        // console.log("applicant", applicant);

        return applicant;
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    resendOTP: async (parent, args) => {
      const { user_id } = args;

      //we need to send an otp to the applicant's email and phone number
      const otp_code = Math.floor(100000 + Math.random() * 900000);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes

      try {
        // first, the user must be a valid user
        const applicant = await getApplicant(user_id);

        if (!applicant) {
          throw new GraphQLError("Invalid user!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }

        // insert the otp details in the database
        let sql4 = `INSERT INTO otps (
            user_id, 
            otp_code, 
            expires_at
            ) VALUES (?, ?, ?)`;
        let values4 = [user_id, otp_code, expiresAt];

        const [results4, fields4] = await db.execute(sql4, values4);

        await sendEmail(applicant.email, otp_code);

        return {
          success: "true",
          message: "OTP sent successfully!",
        };
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    setApplicantPassword: async (parent, args) => {
      const { user_id, password } = args;
      const today = new Date();
      try {
        // first, the user must be a valid user
        const applicant = await getApplicant(user_id);

        if (!applicant) {
          throw new GraphQLError("Invalid user!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }

        // generate a password hash for applicant
        const salt = await bcrypt.genSalt();
        const hashedPwd = await bcrypt.hash(password, salt);

        // insert the password details in the database
        let sql4 = `INSERT INTO applicant_pwds (
            user_id, 
            password, 
            created_on
            ) VALUES (?, ?, ?)`;
        let values4 = [user_id, hashedPwd, today];

        const [results4, fields4] = await db.execute(sql4, values4);

        // update the has_pwd flag in the applicants db
        let sql2 = `UPDATE applicants SET has_pwd = ? WHERE id = ?`;
        let values2 = [1, user_id];

        const [results2, fields2] = await db.execute(sql2, values2);

        // return the verified applicant
        const _applicant = await getApplicant(user_id);

        // console.log("applicant", applicant);

        return _applicant;
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    applicantLogin: async (parent, args) => {
      const { mode, user_id, password } = args;
      let applicant = null;
      try {
        if (mode == "email") {
          // used email to login,
          // first, check if the email is valid
          let sql = `
          SELECT applicants.*, 
          applicant_pwds.id AS pwd_id,
          applicant_pwds.password 
          FROM applicants 
          INNER JOIN applicant_pwds ON applicants.id = applicant_pwds.user_id
          WHERE email = ?
          `;
          let values = [user_id];

          const [results, fields] = await db.execute(sql, values);

          if (!results[0]) {
            throw new GraphQLError("Incorrect Email!", {
              extensions: {
                http: { status: 400 },
              },
            });
          }

          applicant = results[0];
        } else if (mode == "phone") {
          let sql = `
          SELECT applicants.*, 
          applicant_pwds.id AS pwd_id,
          applicant_pwds.password 
          FROM applicants 
          INNER JOIN applicant_pwds ON applicants.id = applicant_pwds.user_id
          WHERE phone_no = ?`;
          let values = [user_id];

          const [results, fields] = await db.execute(sql, values);

          if (!results[0]) {
            throw new GraphQLError("Incorrect Phone Number!", {
              extensions: {
                http: { status: 400 },
              },
            });
          }

          applicant = results[0];
        } else {
          throw new GraphQLError("System Error, Try again later!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }

        // email or password is valid, check the password
        const auth = await bcrypt.compare(password, applicant.password);

        if (auth) {
          return applicant;
        } else {
          throw new GraphQLError("Incorrect Password!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    changeApplicantPassword: async (parent, args) => {
      const { user_id, old_password, new_password } = args;
      // console.log("args", args);
      const today = new Date();
      try {
        // first, the user must be a valid user
        let sql = `SELECT 
        applicants.*, 
        applicant_pwds.id AS pwd_id,
        applicant_pwds.password 
        FROM applicants 
        INNER JOIN applicant_pwds ON applicants.id = applicant_pwds.user_id
        WHERE applicants.id = ?`;
        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);

        // console.log("results", results);

        let applicant = results[0];

        if (!applicant) {
          throw new GraphQLError("Invalid user!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }

        // then check if the old password is valid
        const auth = await bcrypt.compare(old_password, applicant.password);

        if (auth) {
          // now lets change the password
          // generate a password hash for the new password
          const salt = await bcrypt.genSalt();
          const hashedPwd = await bcrypt.hash(new_password, salt);

          // insert the password details in the database
          let sql4 = `UPDATE applicant_pwds set password = ?, changed_on = ?, changed_by = ? WHERE  id = ?`;
          let values4 = [hashedPwd, today, user_id, applicant.pwd_id];

          const [results4, fields4] = await db.execute(sql4, values4);

          return {
            success: "true",
            message: "Password Changed Successfully",
          };
        } else {
          throw new GraphQLError("Incorrect Password!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    saveApplicantBioData: async (parent, args) => {
      const {
        applicant_id,
        form_no,
        admissions_id,
        salutation,
        district_of_birth,
        district_of_origin,
        religion,
        marital_status,
        nin,
        place_of_residence,
        completed_form_sections,
      } = args;

      // first, we need to check for the existence of the applicant
      try {
        const applicant = await getApplicant(applicant_id);

        if (!applicant) {
          throw new GraphQLError("Invalid User!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }

        // update the biodata of the applicant
        let sql2 = `UPDATE applicants SET 
          salutation_id = ?, 
          district_of_birth = ?, 
          district_of_origin = ?, 
          religion = ?, 
          marital_status = ?, 
          nin = ?, 
          place_of_residence = ?
          WHERE id = ?`;

        let values2 = [
          salutation,
          district_of_birth,
          district_of_origin,
          religion,
          marital_status,
          nin,
          place_of_residence,
          applicant_id,
        ];

        const [results2, fields2] = await db.execute(sql2, values2);

        const uniqueFormNumber = generateFormNumber();
        const today = new Date();
        const status = "pending";

        // lets see if the form is already created
        let sql4 = `SELECT * FROM applications WHERE form_no = ?`;
        let values4 = [form_no];

        const [results4, fields4] = await db.execute(sql4, values4);

        // console.log("results566", results4);

        if (!results4[0]) {
          // now, lets create the form for the applicant
          // insert the details in the database
          let sql3 = `INSERT INTO applications (
          applicant_id, 
          form_no, 
          admissions_id, 
          creation_date, 
          status,
          completed_section_ids
          ) VALUES (?, ?, ?, ?, ?, ?)`;

          let values3 = [
            applicant_id,
            uniqueFormNumber,
            admissions_id,
            today,
            status,
            completed_form_sections,
          ];

          const [results3, fields3] = await db.execute(sql3, values3);

          // console.log("results", results3);
        } else {
          // if the application exists, just update the form section ids
          let sql = `UPDATE applications SET completed_section_ids = ? WHERE id = ?`;

          let values = [completed_form_sections, results4[0].id];

          const [results, fields] = await db.execute(sql, values);
        }

        return {
          success: "true",
          message: "Biodata saved Successfully",
        };
      } catch (error) {
        console.log("error", error.message);
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default studentResolvers;
