import {
  tredumoDB,
  db,
  database,
  postgraduateDB,
} from "../../config/config.js";
import { GraphQLError } from "graphql";
import bcrypt from "bcrypt";
import generateFormNumber from "../../utilities/generateApplicationFormNo.js";
import { getProgramChoices } from "../program_choice/resolvers.js";
import { getUnebResultsSummary } from "../uneb_results_summary/resolvers.js";
import { getApplicantQualifications } from "../applicant_qualification/resolvers.js";
import { getApplicantAttachments } from "../application_attachment/resolvers.js";
import { getApplicantNextOfKin } from "../next_of_kin/resolvers.js";
import { getAllRunningAdmissions } from "../running_admissions/resolvers.js";
import { getApplicant, getStudent } from "../student/resolvers.js";
import generateStdno from "../../utilities/generateStdno.js";
import generateRegNo from "../../utilities/emails/generateRegistrationNo.js";
import saveData from "../../utilities/db/saveData.js";
import sendEmail from "../../utilities/emails/admission-mail.js";

export const getApplicationForms = async ({
  form_no,
  admissions_id,
  status,
  is_completed,
  applicant_id,
  course_id,
  campus_id,
  id,
  admitted_stds,
}) => {
  try {
    let where = "";
    let extra_join = "";
    let extra_select = "";
    let extra_order = "";
    let values = [];

    if (id) {
      where += " AND applications.id = ?";
      values.push(id);
    }

    if (applicant_id) {
      where += " AND applications.applicant_id = ?";
      values.push(applicant_id);
    }

    if (admissions_id) {
      where += " AND applications.admissions_id = ?";
      values.push(admissions_id);
    }

    if (form_no) {
      where += " AND applications.form_no = ?";
      values.push(form_no);
    }

    if (status) {
      where += " AND applications.status = ?";
      values.push(status);
    }

    if (is_completed) {
      where += " AND applications.status = ?";
      values.push(is_completed);
    }

    if (course_id || campus_id) {
      extra_join +=
        " LEFT JOIN program_choices ON applications.form_no = program_choices.form_no";

      extra_select +=
        "program_choices.choice_no, program_choices.course_id, program_choices.campus_id, program_choices.study_time_id, program_choices.entry_yr, ";

      if (course_id) {
        where +=
          " AND program_choices.course_id = ? AND program_choices.choice_no = ?";
        values.push(course_id, 1); // considering the first choice
      }

      if (campus_id) {
        where +=
          " AND program_choices.campus_id = ? AND program_choices.choice_no = ?";
        values.push(campus_id, 1); // considering the first choice
      }
    }

    if (admitted_stds) {
      extra_join += ` LEFT JOIN students ON applications.id = students.application_id 
      LEFT JOIN campuses ON students.campus_id = campuses.id
      LEFT JOIN study_times ON students.study_time_id = study_times.id
      LEFT JOIN intakes ON students.intake_id = intakes.id
      `;

      extra_select +=
        "students.*, campuses.campus_title, study_times.study_time_title, intakes.intake_title, students.creation_date as admitted_on, students.id as std_id, ";

      where += " AND applications.is_admitted = ?";
      values.push(1); // considering those admitted only

      extra_order += "students.creation_date";
    }

    let sql = `SELECT ${extra_select} applications.* FROM applications ${extra_join} WHERE applications.deleted = 0 ${where} ORDER BY ${
      extra_order ? extra_order : "applications.id"
    } DESC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching Program Choices " + error.message, {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

export const getAdmittedStdsSummary = async ({
  acc_yr_id,
  scheme_id,
  intake_id,
  id,
}) => {
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
    const isAdmitted = 1; // is admitted
    // now, LETS select applications that have
    let sql = `SELECT 
    applications.admissions_id,
    students.course_id,
    students.campus_id,
    campuses.campus_title,
    courses.course_code,
    courses.course_title,
    COUNT(*) AS student_count 
    FROM applications 
    INNER JOIN students ON applications.id = students.application_id
    LEFT JOIN courses ON courses.id = students.course_id
    LEFT JOIN campuses ON campuses.id = students.campus_id
    WHERE applications.deleted = 0 AND applications.admissions_id = ? AND is_admitted = ?
    GROUP BY course_id, campus_id
    ORDER BY course_code DESC
    `;
    let values = [running_admission_id, isAdmitted];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
    // return results;
  } catch (error) {
    // console.log("error----", error.message);
    throw new GraphQLError(error.message);
  }
};

export const getLatestCourseVersion = async (course_id) => {
  try {
    let sql = `
    SELECT * 
    FROM course_versions 
    WHERE course_id = ? 
    ORDER BY added_on DESC 
    LIMIT 1
    `;
    let values = [course_id];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);

    if (!results[0]) {
      throw new GraphQLError(
        "No Course Version Found: Please add one and try again"
      );
    }
    return results[0];
    // return results;
  } catch (error) {
    console.log("error----", error.message);
    throw new GraphQLError(error.message);
  }
};

export const createApplication = async (
  applicant_id,
  admissions_id,
  completed_form_sections = null
) => {
  try {
    const uniqueFormNumber = generateFormNumber();
    const today = new Date();
    const status = "pending";

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
    // console.log("results 3", results3);
    return results3.insertId;
  } catch (error) {
    console.log("application error", error);
    throw new GraphQLError(error.message);
  }
};

export const updateApplicationCompletedSections = async (
  existingApplicationId,
  completed_form_sections
) => {
  try {
    let sql = `UPDATE applications SET completed_section_ids = ? WHERE id = ?`;

    let values = [completed_form_sections, existingApplicationId];

    const [results, fields] = await db.execute(sql, values);
  } catch (error) {
    throw new GraphQLError(error.message);
  }
};

const applicationResolvers = {
  Query: {
    applications: async (parent, args) => {
      const { admissions_id, applicant_id, course_id, campus_id } = args;

      try {
        const _applications = await getApplicationForms({
          applicant_id,
          admissions_id,
          course_id,
          campus_id,
        });

        return _applications;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    application: async (parent, args) => {
      const { admissions_id, applicant_id, form_no } = args;

      try {
        const application = await getApplicationForms({
          admissions_id,
          applicant_id,
          form_no,
        });

        return application[0];
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    admitted_students_summary: async (parent, args) => {
      const { acc_yr_id, scheme_id, intake_id } = args;

      try {
        const admittedStds = await getAdmittedStdsSummary({
          acc_yr_id,
          scheme_id,
          intake_id,
        });

        // console.log("admitted students", admittedStds);
        return admittedStds;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    admitted_students: async (parent, args) => {
      const { admissions_id, applicant_id, course_id, campus_id } = args;

      try {
        const _applications = await getApplicationForms({
          applicant_id,
          admissions_id,
          course_id,
          campus_id,
          admitted_stds: true, // the flag that activates admitted stds
        });

        // console.log("admitted", _applications);

        return _applications;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  Application: {
    applicant: async (parent, args) => {
      const applicant_id = parent.applicant_id;
      try {
        let sql4 = `SELECT applicants.*, salutations.salutation_code AS salutation FROM applicants 
        LEFT JOIN salutations ON applicants.salutation_id = salutations.id
        WHERE applicants.id = ? `;
        let values4 = [applicant_id];

        const [results4, fields4] = await db.execute(sql4, values4);

        return results4[0];
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    program_choices: async (parent, args) => {
      const applicant_id = parent.applicant_id;
      const form_no = parent.form_no;

      // console.log(form_no);
      try {
        const program_choices = await getProgramChoices({
          applicant_id,
          form_no,
        });
        return program_choices;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    olevel_info: async (parent, args) => {
      const applicant_id = parent.applicant_id;
      const form_no = parent.form_no;

      // console.log(form_no);
      try {
        const unebResults = await getUnebResultsSummary({
          applicant_id,
          form_no,
          uneb_study_level_id: 1, // o level
        });
        return unebResults[0];
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    alevel_info: async (parent, args) => {
      const applicant_id = parent.applicant_id;
      const form_no = parent.form_no;

      // console.log(form_no);
      try {
        const unebResults = await getUnebResultsSummary({
          applicant_id,
          form_no,
          uneb_study_level_id: 2, // a level
        });
        return unebResults[0];
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    other_qualifications: async (parent, args) => {
      const applicant_id = parent.applicant_id;
      const form_no = parent.form_no;

      // console.log(form_no);
      try {
        if (parent.has_other_qualifications) {
          const other_quals = await getApplicantQualifications({
            applicant_id,
            form_no,
          });
          return other_quals;
        } else {
          return null;
        }
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    attachments: async (parent, args) => {
      const applicant_id = parent.applicant_id;
      const form_no = parent.form_no;

      // console.log(form_no);
      try {
        if (parent.has_attachments) {
          const attachments = await getApplicantAttachments({
            applicant_id,
            form_no,
          });
          return attachments;
        } else {
          return null;
        }
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    next_of_kin: async (parent, args) => {
      const applicant_id = parent.applicant_id;
      const form_no = parent.form_no;

      // console.log(form_no);
      try {
        const nextOfKin = await getApplicantNextOfKin({
          applicant_id,
          form_no,
        });
        return nextOfKin[0];
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    running_admissions: async (parent, args) => {
      const admissions_id = parent.admissions_id;

      // console.log(form_no);
      try {
        const running_admissions = await getAllRunningAdmissions({
          id: admissions_id,
        });
        return running_admissions[0];
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    application_fee: async (parent, args) => {
      let _application_fee = "";
      // console.log(form_no);
      try {
        // this is to determine the application fee of the applicant based on nationality
        // first, lets first get the nationality category of the applicant
        let sql4 = `SELECT nationality_category FROM applicants 
        LEFT JOIN nationalities ON nationalities.id = applicants.nationality_id
        WHERE applicants.id = ?
        `;
        let values4 = [parent.applicant_id];

        const [results4, fields4] = await db.execute(sql4, values4);

        const { nationality_category } = results4[0];

        const running_admissions = await getAllRunningAdmissions({
          id: parent.admissions_id,
        });

        // console.log("running admissions", running_admissions);

        if (nationality_category && running_admissions[0]) {
          if (nationality_category == "national") {
            _application_fee = running_admissions[0].national_application_fees;
          } else if (nationality_category == "east_african") {
            _application_fee =
              running_admissions[0].east_african_application_fees;
          } else {
            _application_fee =
              running_admissions[0].international_application_fees;
          }
        }

        // console.log("application feee", _application_fee);

        return _application_fee;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },

  Mutation: {
    admit_students: async (parent, args) => {
      const { applicants, admitted_by } = args;
      // console.log("the args", args);
      let error = false;
      try {
        // const admit = await applicants.map(async (applicant) => {
        for (const applicant of applicants) {
          const { application_id, prog_choice_id, std_id } = applicant;

          if (!std_id) {
            // the application
            const _application = await getApplicationForms({
              id: application_id,
            });

            // the program choice
            const _program_choices = await getProgramChoices({
              id: prog_choice_id,
            });

            // console.log({
            //   // _application,
            //   _program_choices,
            // });

            if (!_application[0] || !_program_choices[0]) {
              error = true;
            }

            // the admission setup
            const admissions = await getAllRunningAdmissions({
              id: _application[0].admissions_id,
            });

            // student number
            const stdno = await generateStdno();

            // registration number
            // 2021/FEB/BCS/B227811/DAY
            const regno = generateRegNo({
              intake: admissions[0].intake_title,
              course_code: _program_choices[0].course_code,
              level: _program_choices[0].level_code,
              study_time: _program_choices[0].study_time_title,
            });

            // we need to know the latest version of the course admitted to student
            const course_version = await getLatestCourseVersion(
              _program_choices[0].course_id
            );

            // console.log({
            //   // _application,
            //   course_version,
            // });

            // let insert in the students table
            const data1 = {
              student_no: stdno,
              registration_no: regno,
              applicant_id: _application[0].applicant_id,
              application_id,
              form_no: _application[0].form_no,
              program_choice_id: prog_choice_id,
              study_time_id: _program_choices[0].study_time_id,
              entry_study_yr: _program_choices[0].entry_yr,
              entry_acc_yr: admissions[0].acc_yr_id,
              course_id: _program_choices[0].course_id,
              course_version_id: course_version ? course_version.id : "",
              intake_id: admissions[0].intake_id,
              campus_id: _program_choices[0].campus_id,
              added_by: admitted_by,
              verified_by: admitted_by,
              creation_date: new Date(),
            };

            // console.log({
            //   regno,
            //   stdno,
            //   data1,
            //   // admissions,
            //   // _applicant,
            //   // _application,
            //   // _program_choices,
            // });

            // admit
            const save_id = await saveData({
              table: "students",
              data: data1,
              id: std_id,
            });

            // update applications
            const data2 = {
              std_id: save_id,
              is_admitted: 1, // has been admitted
              admitted_by: admitted_by,
              is_verified: 1,
            };

            await saveData({
              table: "applications",
              data: data2,
              id: application_id,
            });

            // send an email to whoever thats admitted
            const _applicant = await getApplicant(_application[0].applicant_id);
            // awaiting this might unnecessarily delay the response
            try {
              sendEmail({
                to: _applicant.email,
                subject: "NKUMBA UNIVERSITY ADMISSIONS",
                message: `Congratulations!, You have been successfully admitted to the programme of study leading to the award of: ${_program_choices[0].course_title} \n
                Go https://admissions.nkumbauniversity.ac.ug/ to view the admission details
                `,
              });
            } catch (error) {
              throw new GraphQLError("SERVER_ERROR");
            }
          }
        }
        // await Promise.all(admit);

        // am ignoring the ones that are already admitted

        if (error) {
          throw new GraphQLError("SERVER_ERROR");
        }

        return {
          success: "true",
          message: "Students admitted Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            http: { status: 501 },
          },
        });
      }
    },
    push_to_std_info_center: async (parent, args) => {
      // console.log("args", args);
      const { std_ids, pushed_by } = args;
      try {
        // const admit = await applicants.map(async (applicant) => {
        for (const std_id of std_ids) {
          // first, lets see if the student is valid
          const student = await getStudent(std_id);

          // console.log("the student", student);

          if (!student) {
            throw new GraphQLError(`No student with id : ${std_id}`);
          }

          // let insert in the students table
          const data1 = {
            is_std_verified: 1,
          };

          // push
          const save_id = await saveData({
            table: "students",
            data: data1,
            id: std_id,
          });
        }

        return {
          success: "true",
          message: "Students Pushed to Information Center Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            http: { status: 501 },
          },
        });
      }
    },
  },
};

export default applicationResolvers;