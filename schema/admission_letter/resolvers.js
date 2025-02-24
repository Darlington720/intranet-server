import {
  tredumoDB,
  db,
  database,
  postgraduateDB,
  host,
  port,
} from "../../config/config.js";
import fs from "fs";
import { GraphQLError } from "graphql";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import saveData from "../../utilities/db/saveData.js";
import { getApplicationForms } from "../application/resolvers.js";
import { getAllRunningAdmissions } from "../running_admissions/resolvers.js";
import generateAdmissionLetter from "../../utilities/helpers/test.js";
import { getStudents } from "../student/resolvers.js";
import { getApplicant } from "../applicant/resolvers.js";
import generateLetter from "../../utilities/helpers/generateLetter.js";
import formatDateCustom from "../../utilities/helpers/formatDateCustom.js";
import { getTuitionFees } from "../tuition_fees/resolvers.js";
import { getFunctionalFees } from "../functional_fee/resolvers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getStudentDate = (data, dates) => {
  if (!dates) return null;
  const result = dates.find((date) => date.study_time_id == data.study_time_id);

  return result || null;
};

const getAdmissionTemplate = async ({ id, scheme_id, intake_id }) => {
  let where = "";
  let values = [];

  if (id) {
    where += " AND admission_letters.id = ?";
    values.push(id);
  }

  if (scheme_id) {
    where += " AND admission_letters.scheme_id = ?";
    values.push(scheme_id);
  }

  if (intake_id) {
    where += " AND admission_letters.intake_id = ?";
    values.push(intake_id);
  }

  let sql = `
    SELECT 
      admission_letters.*,
      intakes.intake_title,
      schemes.scheme_title,
      CONCAT(salutations.salutation_code, ' ', employees.surname, ' ', employees.other_names) AS last_modified_by_user
    FROM admission_letters
    LEFT JOIN intakes ON intakes.id = admission_letters.intake_id
    LEFT JOIN schemes ON schemes.id = admission_letters.scheme_id
    LEFT JOIN employees ON employees.id = admission_letters.last_modified_by
    LEFT JOIN salutations ON salutations.id = employees.salutation_id
    WHERE admission_letters.deleted = 0 ${where}
    ORDER BY admission_letters.created_on DESC;
    `;

  const [results] = await db.execute(sql, values);

  return results;
};

const applicationResolvers = {
  Query: {
    admission_letters: async (parent, args) => {
      // return admission letters
      const letters = await getAdmissionTemplate({});

      return letters;
    },
    print_admission_letter: async (parent, args, context) => {
      const applicant_id = context.req.user.applicant_id;

      const { form_no } = args;

      try {
        // get applicant details
        const applicant_details = await getApplicant(applicant_id);

        if (!applicant_details) {
          throw new GraphQLError("Invalid Applicant!");
        }

        // get the application details
        const [form] = await getApplicationForms({
          form_no,
          applicant_id,
        });

        if (!form) {
          throw new GraphQLError("Form Not found!");
        }

        if (!form.is_admitted) {
          throw new GraphQLError(
            "Student doesnt qualify for an admission letter"
          );
        }

        // get the running admission details
        const [running_admissions] = await getAllRunningAdmissions({
          id: form.admissions_id,
          details: true,
        });

        // lets now focus on getting the template
        const [template_details] = await getAdmissionTemplate({
          scheme_id: running_admissions.scheme_id,
          intake_id: running_admissions.intake_id,
        });

        if (!template_details) {
          throw new GraphQLError("Failed to get Admission letter!");
        }

        const [student_details] = await getStudents({
          std_id: form.std_id,
          get_course_details: true,
        });

        const reportingDates = JSON.parse(template_details.reporting_dates);
        const registrationDates = JSON.parse(
          template_details.registration_dates
        );
        const lectureDates = JSON.parse(template_details.lecture_dates);

        const stdReportDate = getStudentDate(student_details, reportingDates);

        const stdRegistrationDate = getStudentDate(
          student_details,
          registrationDates
        );

        const stdLectureDate = getStudentDate(student_details, lectureDates);

        // lets now fetch the tuition fees
        const tuition_fees = await getTuitionFees({
          acc_yr_id: student_details.entry_acc_yr,
          campus_id: student_details.campus_id,
          intake_id: student_details.intake_id,
          course_id: student_details.course_id,
          nationality_category_id: applicant_details.nationality_category_id,
          study_time_id: student_details.study_time_id,
          study_yr: 1,
        });

        // lets now fetch the funnctional fees
        const functional_fees = await getFunctionalFees({
          acc_yr_id: student_details.entry_acc_yr,
          campus_id: student_details.campus_id,
          intake_id: student_details.intake_id,
          nationality_category_id: applicant_details.nationality_category_id,
          study_time_id: student_details.study_time_id,
          level_id: student_details.level,
        });

        // console.log("tuition fees", tuition_fees);
        if (tuition_fees.length == 0) {
          throw new GraphQLError(
            `Tuition Fees for ${student_details.course_code} Intake ${student_details.intake_title} academic year ${student_details.entry_acc_yr_title} not yet set`
          );
        }

        if (functional_fees.length == 0) {
          throw new GraphQLError(
            `Functional Fees for ${student_details.course_code} Intake ${student_details.intake_title} academic year ${student_details.entry_acc_yr_title} not yet set`
          );
        }

        const total_tuition_amount = tuition_fees.reduce(
          (sum, item) => sum + Number(item.amount),
          0
        );

        const total_functional_amount = functional_fees.reduce(
          (sum, item) => sum + Number(item.amount),
          0
        );

        const total_fees_amount =
          total_tuition_amount + total_functional_amount;

        const data = {
          student_number: student_details.student_no,
          student_name: `${applicant_details.surname} ${applicant_details.other_names}`,
          scheme: running_admissions.scheme_title,
          intake: running_admissions.intake_title,
          campus: student_details.campus_title,
          study_session: student_details.study_time_title,
          date: new Date().toLocaleDateString(),
          course_duration: `${student_details.course_duration} YEARS`,
          course: student_details.course_title,
          academic_year: student_details.entry_acc_yr_title,
          nationality: applicant_details.nationality_title,
          header: template_details.header,
          signature: template_details.signature,
          reporting_date: formatDateCustom(stdReportDate.date),
          registration_start_date: formatDateCustom(
            stdRegistrationDate.dates[0]
          ),
          registration_end_date: formatDateCustom(
            stdRegistrationDate?.dates[1]
          ),
          lectures_start_date: formatDateCustom(stdLectureDate?.dates[0]),
          lectures_end_date: formatDateCustom(stdLectureDate?.dates[1]),
          course_code: student_details.course_code,
          tuition_fee: total_tuition_amount.toLocaleString(),
          functional_fees: total_functional_amount.toLocaleString(),
          total_fees_amount: total_fees_amount.toLocaleString(),
          // fees_per_semester: "3 M",
        };

        // console.log("data", data);
        const admissionLetter = generateLetter(template_details, data);

        return {
          admission_letter: admissionLetter,
          background_image: template_details?.background
            ? `http://${host}:${port}/templates/background_imgs/${template_details?.background}`
            : null,
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    print_admission_letters: async (parent, args, context) => {
      const { students } = args;

      try {
        let admissionLetters = [];
        for (const student of students) {
          const { applicant_id, form_no } = student;
          // get applicant details
          const applicant_details = await getApplicant(applicant_id);

          if (!applicant_details) {
            throw new GraphQLError("Invalid Applicant!");
          }

          // get the application details
          const [form] = await getApplicationForms({
            form_no,
            applicant_id,
          });

          if (!form) {
            throw new GraphQLError("Form Not found!");
          }

          if (!form.is_admitted) {
            throw new GraphQLError(
              "Student doesnt qualify for an admission letter"
            );
          }

          // get the running admission details
          const [running_admissions] = await getAllRunningAdmissions({
            id: form.admissions_id,
            details: true,
          });

          // lets now focus on getting the template
          const [template_details] = await getAdmissionTemplate({
            scheme_id: running_admissions.scheme_id,
            intake_id: running_admissions.intake_id,
          });

          if (!template_details) {
            throw new GraphQLError("Failed to get Admission letter!");
          }

          const [student_details] = await getStudents({
            std_id: form.std_id,
            get_course_details: true,
          });

          const reportingDates = JSON.parse(template_details.reporting_dates);
          const registrationDates = JSON.parse(
            template_details.registration_dates
          );
          const lectureDates = JSON.parse(template_details.lecture_dates);

          const stdReportDate = getStudentDate(student_details, reportingDates);

          const stdRegistrationDate = getStudentDate(
            student_details,
            registrationDates
          );

          const stdLectureDate = getStudentDate(student_details, lectureDates);

          // lets now fetch the tuition fees
          const tuition_fees = await getTuitionFees({
            acc_yr_id: student_details.entry_acc_yr,
            campus_id: student_details.campus_id,
            intake_id: student_details.intake_id,
            course_id: student_details.course_id,
            nationality_category_id: applicant_details.nationality_category_id,
            study_time_id: student_details.study_time_id,
            study_yr: 1,
          });

          // lets now fetch the funnctional fees
          const functional_fees = await getFunctionalFees({
            acc_yr_id: student_details.entry_acc_yr,
            campus_id: student_details.campus_id,
            intake_id: student_details.intake_id,
            nationality_category_id: applicant_details.nationality_category_id,
            study_time_id: student_details.study_time_id,
            level_id: student_details.level,
          });

          // console.log("tuition fees", tuition_fees);
          if (tuition_fees.length == 0) {
            throw new GraphQLError(
              `Tuition Fees for ${student_details.course_code} Intake ${student_details.intake_title} academic year ${student_details.entry_acc_yr_title} not yet set`
            );
          }

          if (functional_fees.length == 0) {
            throw new GraphQLError(
              `Functional Fees for ${student_details.course_code} Intake ${student_details.intake_title} academic year ${student_details.entry_acc_yr_title} not yet set`
            );
          }

          const total_tuition_amount = tuition_fees.reduce(
            (sum, item) => sum + Number(item.amount),
            0
          );

          const total_functional_amount = functional_fees.reduce(
            (sum, item) => sum + Number(item.amount),
            0
          );

          const total_fees_amount =
            total_tuition_amount + total_functional_amount;

          const data = {
            student_number: student_details.student_no,
            student_name: `${applicant_details.surname} ${applicant_details.other_names}`,
            scheme: running_admissions.scheme_title,
            intake: running_admissions.intake_title,
            campus: student_details.campus_title,
            study_session: student_details.study_time_title,
            date: new Date().toLocaleDateString(),
            course_duration: `${student_details.course_duration} YEARS`,
            course: student_details.course_title,
            academic_year: student_details.entry_acc_yr_title,
            nationality: applicant_details.nationality_title,
            header: template_details.header,
            signature: template_details.signature,
            reporting_date: formatDateCustom(stdReportDate.date),
            registration_start_date: formatDateCustom(
              stdRegistrationDate.dates[0]
            ),
            registration_end_date: formatDateCustom(
              stdRegistrationDate?.dates[1]
            ),
            lectures_start_date: formatDateCustom(stdLectureDate?.dates[0]),
            lectures_end_date: formatDateCustom(stdLectureDate?.dates[1]),
            course_code: student_details.course_code,
            tuition_fee: total_tuition_amount.toLocaleString(),
            functional_fees: total_functional_amount.toLocaleString(),
            total_fees_amount: total_fees_amount.toLocaleString(),
            // fees_per_semester: "3 M",
          };

          // console.log("data", data);
          const admissionLetter = generateLetter(template_details, data);

          const result = {
            admission_letter: admissionLetter,
            background_image: template_details?.background
              ? `http://${host}:${port}/templates/background_imgs/${template_details?.background}`
              : null,
          };

          admissionLetters.push(result);
        }

        return admissionLetters;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  Mutation: {
    saveAdmissionLetter: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const {
        id,
        intake_id,
        scheme_id,
        description,
        file,
        file_name,
        template_id,
      } = args.payload;

      console.log("payload", args.payload);

      try {
        // lets first cater for the file
        // console.log(attachment);
        let newFilename;

        // if the attachment doesnt exist
        if (file) {
          if (!template_id) {
            const _file = await file;

            const { createReadStream, filename, mimetype, encoding } = _file;

            // Generate a random string for the filename
            const randomString = randomBytes(16).toString("hex");
            const extension = path.extname(filename).slice(1); // Extract file extension
            newFilename = `${randomString}.${extension}`;
            // Define the path where the file will be saved
            const filePath = path.join(
              __dirname,
              "../../public/templates/admission_letters",
              newFilename
            );

            // Ensure the 'attachments' directory exists
            fs.mkdirSync(path.join(__dirname, "admission_letters"), {
              recursive: true,
            });

            // // Create a writable stream to save the file
            const stream = createReadStream();
            const out = fs.createWriteStream(filePath);

            // Pipe the file data into the writable stream
            stream.pipe(out);
          } else {
            // use the existing id to get the existing filename
            const existingTemplate = await getAdmissionTemplate({
              template_id: template_id,
            });
            newFilename = existingTemplate[0].template_id;
          }
        }

        if (id) {
          // update the record
          let _data = {
            name: description,
            scheme_id,
            intake_id,
            last_modified_on: new Date(),
            last_modified_by: user_id,
          };

          if (file) {
            // add the file props
            _data = {
              ..._data,
              template_id: newFilename,
              file_name,
            };
          }

          const save_id = await saveData({
            table: "admission_letters",
            data: _data,
            id,
          });
        } else {
          // now, we want to store admission letters
          const data = {
            name: description,
            scheme_id,
            intake_id,
            template_id: newFilename,
            file_name,
            created_on: new Date(),
            created_by: user_id,
            last_modified_on: new Date(),
            last_modified_by: user_id,
          };

          const save_id = await saveData({
            table: "admission_letters",
            data,
            id: null,
          });
        }

        return {
          success: "true",
          message: "Admission Letter Saved Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    saveAdmissionTemplate: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const {
        id,
        intake_id,
        scheme_id,
        template_name,
        content,
        layout_width,
        layout_height,
        header,
        signature,
        background,
        reporting_dates,
        registration_dates,
        lecture_dates,
      } = args.payload;

      try {
        let headerName;
        let signatureName;
        let backgroundName;

        if (header) {
          const _file = await header;

          const { createReadStream, filename, mimetype, encoding } = _file;

          // Generate a random string for the filename
          const randomString = randomBytes(16).toString("hex");
          const extension = path.extname(filename).slice(1); // Extract file extension
          headerName = `${randomString}.${extension}`;
          // Define the path where the file will be saved
          const filePath = path.join(
            __dirname,
            "../../public/templates/headers",
            headerName
          );
          fs.mkdirSync(path.join(__dirname, "headers"), {
            recursive: true,
          });

          // // Create a writable stream to save the file
          const stream = createReadStream();
          const out = fs.createWriteStream(filePath);

          // Pipe the file data into the writable stream
          stream.pipe(out);
        }

        if (signature) {
          const _file = await signature;

          const { createReadStream, filename, mimetype, encoding } = _file;

          // Generate a random string for the filename
          const randomString = randomBytes(16).toString("hex");
          const extension = path.extname(filename).slice(1); // Extract file extension
          signatureName = `${randomString}.${extension}`;
          // Define the path where the file will be saved
          const filePath = path.join(
            __dirname,
            "../../public/templates/signatures",
            signatureName
          );
          fs.mkdirSync(path.join(__dirname, "signatures"), {
            recursive: true,
          });

          // // Create a writable stream to save the file
          const stream = createReadStream();
          const out = fs.createWriteStream(filePath);

          // Pipe the file data into the writable stream
          stream.pipe(out);
        }

        if (background) {
          const _file = await background;

          const { createReadStream, filename, mimetype, encoding } = _file;

          // Generate a random string for the filename
          const randomString = randomBytes(16).toString("hex");
          const extension = path.extname(filename).slice(1); // Extract file extension
          backgroundName = `${randomString}.${extension}`;
          // Define the path where the file will be saved
          const filePath = path.join(
            __dirname,
            "../../public/templates/background_imgs",
            backgroundName
          );

          fs.mkdirSync(path.join(__dirname, "background_imgs"), {
            recursive: true,
          });

          // // Create a writable stream to save the file
          const stream = createReadStream();
          const out = fs.createWriteStream(filePath);

          // Pipe the file data into the writable stream
          stream.pipe(out);
        }

        if (id) {
          // update the record
          let _data = {
            name: template_name,
            scheme_id,
            intake_id,
            content,
            layout_width,
            layout_height,
            reporting_dates,
            registration_dates,
            lecture_dates,
            last_modified_on: new Date(),
            last_modified_by: user_id,
          };

          if (header) {
            _data = {
              ..._data,
              header: headerName,
            };
          }

          if (signatureName) {
            _data = {
              ..._data,
              signature: signatureName,
            };
          }

          if (backgroundName) {
            _data = {
              ..._data,
              background: backgroundName,
            };
          }

          const save_id = await saveData({
            table: "admission_letters",
            data: _data,
            id,
          });
        } else {
          // now, we want to store admission letters
          const data = {
            name: template_name,
            scheme_id,
            intake_id,
            content,
            layout_width,
            layout_height,
            header: headerName,
            signature: signatureName,
            background: backgroundName,
            reporting_dates,
            registration_dates,
            lecture_dates,
            created_on: new Date(),
            created_by: user_id,
            last_modified_on: new Date(),
            last_modified_by: user_id,
          };

          const save_id = await saveData({
            table: "admission_letters",
            data,
            id: null,
          });
        }

        return {
          success: "true",
          message: "Admission Template Saved Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default applicationResolvers;
