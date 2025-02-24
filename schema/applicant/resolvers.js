import { APPLICANT_PRIVATE_KEY, db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import sendEmail from "../../utilities/emails/email-otp.js";
import bcrypt from "bcrypt";
import generateFormNumber from "../../utilities/generateApplicationFormNo.js";
import { getAllRunningAdmissions } from "../running_admissions/resolvers.js";
import saveData from "../../utilities/db/saveData.js";
import jwt from "jsonwebtoken";
import saveDataWithOutDuplicates from "../../utilities/db/saveDataWithOutDuplicates.js";
import { getApplicationForms } from "../application/resolvers.js";

export const getApplicant = async (applicant_id) => {
  try {
    let sql = `SELECT 
      applicants.*, 
      nationalities.nationality_category_id as nationality_category_id,
      nationalities.nationality_title,
      salutations.salutation_code AS salutation 
      FROM applicants 
      LEFT JOIN salutations ON applicants.salutation_id = salutations.id
      LEFT JOIN nationalities ON applicants.nationality_id = nationalities.id
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

export const getApplicantsSummary = async ({
  acc_yr_id,
  scheme_id,
  intake_id,
  completed,
  school_id,
  admitted,
}) => {
  try {
    let where = "";
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

    let values = [running_admission_id, choice_no];

    if (completed) {
      where += " AND a.is_completed = ?";
      values.push(completed);
    }

    if (school_id && school_id !== "all") {
      where += " AND cr.school_id = ?";
      values.push(school_id);
    }

    if (admitted) {
      where += " AND a.is_admitted = ?";
      values.push(admitted);
    }

    // let sql = `SELECT
    //   program_choices.admissions_id,
    //   program_choices.course_id,
    //   program_choices.campus_id,
    //   COUNT(*) AS student_count,
    //   campuses.campus_title,
    //   courses.course_code,
    //   courses.course_title
    //   FROM program_choices
    //   LEFT JOIN courses ON program_choices.course_id = courses.id
    //   LEFT JOIN campuses ON program_choices.campus_id = campuses.id
    //   WHERE program_choices.deleted = 0 AND admissions_id = ? AND choice_no = ?
    //   GROUP BY course_code, campus_title`;

    let sql = `
    SELECT 
    a.admissions_id,
    pc.course_id,
    pc.campus_id,
    c.campus_title,
    COUNT(*) AS student_count,
    cr.course_code,
    cr.course_title
    FROM applications a
    LEFT JOIN program_choices pc ON pc.form_no = a.form_no
    LEFT JOIN courses cr ON pc.course_id = cr.id
    LEFT JOIN campuses c ON pc.campus_id = c.id
    WHERE pc.deleted = 0 AND a.admissions_id = ? AND pc.choice_no = ? ${where}
    GROUP BY cr.course_code, c.campus_title;
    `;

    const [results] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
    // return results;
  } catch (error) {
    // console.log("error----", error.message);
    throw new GraphQLError(error.message);
  }
};

export const checkApplicantData = async (applicant_id, applicantData) => {
  try {
    // Any section that is sent must first pass thru this middleware
    // First, check if the applicant already exists

    const applicant = await getApplicant(applicant_id);

    if (!applicant) {
      throw new GraphQLError("Invalid User ID!");
    }

    // now, we need the application form number
    let form_no = applicantData.form_no;

    if (!form_no) {
      form_no = generateFormNumber();

      const data = {
        applicant_id,
        form_no,
        admissions_id: applicantData.admissions_id,
        creation_date: new Date(),
        status: "in_progress",
      };

      await saveData({
        table: "applications",
        data,
        id: applicantData.form_no,
        idColumn: "form_no",
      });
    }

    return { ...applicantData, form_no };
  } catch (error) {
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
        const { acc_yr_id, scheme_id, intake_id, completed, school_id } = args;

        const summary = await getApplicantsSummary({
          acc_yr_id,
          scheme_id,
          intake_id,
          completed,
          school_id,
        });

        return summary;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    applicantProfile: async (parent, args, context) => {
      const user_id = context.req.user.applicant_id;

      try {
        const applicant = await getApplicant(user_id);

        if (!applicant) {
          throw new GraphQLError("Invalid User!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }

        return applicant;
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
        let sql = `
        SELECT 
          applicants.*, 
          otps.id as otp_id 
          FROM applicants
          LEFT JOIN otps ON otps.user_id = applicants.id
          WHERE email = ?`;
        let values = [email];

        const [results] = await db.execute(sql, values);

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

        // now let's return the registered user
        const applicant = await getApplicant(save_id);

        // return an access token
        let token;

        // Generate a token for an existing user
        token = jwt.sign(
          {
            applicant_id: applicant.id,
            email: applicant.email,
            phone_no: applicant.phone_no,
            verify_email: true,
            set_pwd: true,
          },
          APPLICANT_PRIVATE_KEY,
          { expiresIn: "1d" }
        );

        return { token };
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    verifyOTP: async (parent, args, context) => {
      const user_id = context.req.user.applicant_id;

      const { otp_code } = args;

      // check if otp is valid
      try {
        let sql = `SELECT * FROM otps WHERE user_id = ? AND otp_code = ? ORDER BY id DESC LIMIT 1`;
        let values = [user_id, otp_code];

        const [results] = await db.execute(sql, values);

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

        await db.execute(sql2, values2);

        return {
          success: "true",
          message: "OTP verified successfully!",
        };
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    resendOTP: async (parent, args, context) => {
      const user_id = context.req.user.applicant_id;

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

        await db.execute(sql4, values4);

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
    setApplicantPassword: async (parent, args, context) => {
      const user_id = context.req.user.applicant_id;
      const { password } = args;
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

        await db.execute(sql2, values2);

        return {
          success: "true",
          message: "Password set successfully!",
        };
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    applicantLogin: async (parent, args) => {
      const { user_id, password } = args;
      try {
        const sql = `
          SELECT applicants.*, 
                 applicant_pwds.id AS pwd_id, 
                 applicant_pwds.password 
          FROM applicants 
          LEFT JOIN applicant_pwds ON applicants.id = applicant_pwds.user_id
          WHERE email = ? OR phone_no = ?
        `;
        const values = [user_id, user_id];

        const [results] = await db.execute(sql, values);

        if (!results.length) {
          throw new GraphQLError("Incorrect User ID or Password!", {
            extensions: { http: { status: 400 } },
          });
        }

        const { password: hashedPassword, ...applicant } = results[0];

        if (
          !hashedPassword ||
          !(await bcrypt.compare(password, hashedPassword))
        ) {
          throw new GraphQLError("Incorrect User ID or Password!", {
            extensions: { http: { status: 400 } },
          });
        }

        const token = jwt.sign(
          { applicant_id: applicant.id },
          APPLICANT_PRIVATE_KEY,
          {
            expiresIn: "1d",
          }
        );

        return { token };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    changeApplicantPassword: async (parent, args, context) => {
      const user_id = context.req.user.applicant_id;
      const { old_password, new_password } = args;
      // console.log("args", args);
      const today = new Date();
      try {
        // first, the user must be a valid user
        let sql = `SELECT 
        applicants.*, 
        applicant_pwds.id AS pwd_id,
        applicant_pwds.password 
        FROM applicants 
        LEFT JOIN applicant_pwds ON applicants.id = applicant_pwds.user_id
        WHERE applicants.id = ?`;
        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);

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

        if (!auth) {
          throw new GraphQLError("Incorrect Old Password!", {
            extensions: {
              http: { status: 400 },
            },
          });
        }

        // now lets change the password
        // generate a password hash for the new password
        const salt = await bcrypt.genSalt();
        const hashedPwd = await bcrypt.hash(new_password, salt);

        // insert the password details in the database
        let sql4 = `UPDATE applicant_pwds set password = ?, changed_on = ?, changed_by = ? WHERE  id = ?`;
        let values4 = [hashedPwd, today, user_id, applicant.pwd_id];

        await db.execute(sql4, values4);

        return {
          success: "true",
          message: "Password Changed Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    saveApplicantBioData: async (parent, args, context) => {
      const applicant_id = context.req.user.applicant_id;

      try {
        const applicantData = await checkApplicantData(
          applicant_id,
          args.payload
        );

        const data = {
          salutation_id: applicantData.salutation,
          district_of_birth: applicantData.district_of_birth,
          district_of_origin: applicantData.district_of_origin,
          religion: applicantData.religion,
          marital_status: applicantData.marital_status,
          nin: applicantData.nin,
          place_of_residence: applicantData.place_of_residence,
          is_complete: true,
        };

        await saveData({
          table: "applicants",
          data,
          id: applicant_id,
          idColumn: "id",
        });

        const application = await getApplicationForms({
          running_admissions_id: applicantData.admissions_id,
          applicant_id,
          form_no: applicantData.form_no,
          application_details: true,
        });

        return {
          success: true,
          message: "Applicant Bio Data Saved Successfully",
          result: application[0],
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default applicantResolvers;
