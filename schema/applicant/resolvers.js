import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import sendEmail from "../../utilities/emails/email-otp.js";
import bcrypt from "bcrypt";
import generateFormNumber from "../../utilities/generateApplicationFormNo.js";
import { getAllRunningAdmissions } from "../running_admissions/resolvers.js";
import saveData from "../../utilities/db/saveData.js";

export const getApplicant = async (applicant_id) => {
  try {
    let sql = `SELECT 
      applicants.*, 
      nationality_categories.id as nationality_category_id,
      salutations.salutation_code AS salutation 
      FROM applicants 
      LEFT JOIN salutations ON applicants.salutation_id = salutations.id
      LEFT JOIN nationality_categories ON applicants.nationality_id = nationality_categories.id
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

const getApplicantsSummary = async ({ acc_yr_id, scheme_id, intake_id }) => {
  try {
    // first, i need the running admissions_id
    const running_admissions = await getAllRunningAdmissions({
      acc_yr_id,
      scheme_id,
      intake_id,
    });

    // console.log("running admissions", running_admissions);

    if (!running_admissions[0]) {
      throw new GraphQLError("No Running admissions found!");
    }

    const running_admission_id = running_admissions[0].id;
    const choice_no = 1; // considering first choices only

    let sql = `SELECT 
      program_choices.admissions_id,
      program_choices.course_id,
      program_choices.campus_id,
      COUNT(*) AS student_count,
      campuses.campus_title,
      courses.course_code, 
      courses.course_title 
      FROM program_choices 
      LEFT JOIN courses ON program_choices.course_id = courses.id
      LEFT JOIN campuses ON program_choices.campus_id = campuses.id
      WHERE program_choices.deleted = 0 AND admissions_id = ? AND choice_no = ? 
      GROUP BY course_code, campus_title
      ORDER BY course_code DESC`;
    let values = [running_admission_id, choice_no];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
    // return results;
  } catch (error) {
    // console.log("error----", error.message);
    throw new GraphQLError(error.message);
  }
};

const applicantResolvers = {
  Query: {
    applicant: async () => {
      const result = await getAllNationalities();
      return result;
    },
    applicantsSammary: async (parent, args) => {
      try {
        const { acc_yr_id, scheme_id, intake_id } = args;

        const summary = await getApplicantsSummary({
          acc_yr_id,
          scheme_id,
          intake_id,
        });

        return summary;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  Applicant: {
    nationality: async (parent, args) => {
      try {
        const nationality_id = parent.nationality_id;
        let sql = `SELECT * FROM nationalities WHERE id = ?`;

        let values = [nationality_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting nationality
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching Nationality: " + error.message, {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
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

export default applicantResolvers;
