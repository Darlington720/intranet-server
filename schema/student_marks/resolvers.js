import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { getCourseUnits } from "../course_unit/resolvers.js";
import fetchOrCreateRecord from "../../utilities/helpers/fetchOrCreateRecord.js";
import { getEmployees } from "../employee/resolvers.js";
import saveData from "../../utilities/db/saveData.js";
import calculateGrades from "../../utilities/helpers/calculateGrades.js";
import { getStudents } from "../student/resolvers.js";
import { getAccYrs } from "../acc_yr/resolvers.js";
import { getCampus } from "../campus/resolvers.js";
import { getIntake } from "../intake/resolvers.js";
import { getStudyTime } from "../study_time/resolvers.js";
import { getRunningSemesters } from "../academic_schedule/resolvers.js";
import sendEmail from "../../utilities/emails/admission-mail.js";
import { getApplicant, getOTP } from "../applicant/resolvers.js";

export const getMissingMarks = async ({
  course_id,
  student_no,
  course_version_id,
}) => {
  let where = "";
  let values = [];

  console.log("student number", student_no);

  // Fetch all course units for the given course
  if (course_id) {
    where += " AND course_units.course_id = ?";
    values.push(course_id);
  }

  if (course_version_id) {
    where += " AND course_units.course_version_id = ?";
    values.push(course_version_id);
  }

  let sql = `
    SELECT * FROM course_units WHERE course_units.deleted = 0 ${where} LIMIT 5
  `;

  let [courseUnits] = await db.execute(sql, values);

  // Fetch all results for the student in those course units
  let sql2 = `
    SELECT * FROM results 
    WHERE results.deleted = 0 AND student_no = ? LIMIT 5
  `;

  let [studentMarks] = await db.execute(sql2, [student_no]);

  // console.log("course_units", courseUnits);
  // console.log("studentMarks", studentMarks);

  // Find missing marks
  // const missingMarks = courseUnits.filter((unit) =>
  //   studentMarks.some((mark) => mark.module_id === unit.id)
  // );

  // const course_units = [
  //   { id: 101, course_unit_code: "MATH101" },
  //   { id: 102, course_unit_code: "PHY101" },
  //   { id: 103, course_unit_code: "CHEM101" },
  // ];

  // const student_marks = [
  //   { module_id: 101, student_no: "S123", final_mark: 80 },
  //   { module_id: 103, student_no: "S123", final_mark: 75 },
  // ];

  // const missingMarks = course_units.filter(
  //   (unit) => !student_marks.some((mark) => mark.module_id === unit.id)
  // );

  return missingMarks;
};

export const getStdMarks = async ({
  student_no,
  module_id,
  student_nos,
  start,
  limit,
}) => {
  try {
    let whereClauses = [];
    let values = [];

    if (student_no) {
      whereClauses.push("results.student_no = ?");
      values.push(student_no);
    }

    if (module_id) {
      whereClauses.push("results.module_id = ?");
      values.push(module_id);
    }

    if (student_nos && Array.isArray(student_nos) && student_nos.length > 0) {
      const placeholders = student_nos.map(() => "?").join(",");
      whereClauses.push(`results.student_no IN (${placeholders})`);
      values.push(...student_nos); // Add all student numbers to the values array
    }

    const where =
      whereClauses.length > 0
        ? `WHERE deleted = 0 AND ${whereClauses.join(" AND ")}`
        : "WHERE deleted = 0";

    const sql = `SELECT 
      results.* 
      FROM results
      ${where} ORDER BY study_yr ASC, semester ASC`;

    const [results] = await db.execute(sql, values);
    return results;
  } catch (error) {
    console.log("Error fetching student marks:", error);
    throw new GraphQLError("Error fetching student marks.");
  }
};

export const getStdResults = async ({
  acc_yr_id,
  student_no,
  module_id,
  student_nos,
  course_units,
  uploaded_by,
  cw_uploaded_by,
  version_id,
  study_yr,
  entry_acc_yr,
  sem,
  course_id,
  start = 0,
  limit = 50,
}) => {
  try {
    let where = "WHERE r.deleted = 0";
    let order_by = "";
    let extra_join = "";
    let extra_select = "";
    const values = [];

    // Add filters
    if (acc_yr_id) {
      where += " AND r.acc_yr_id = ?";
      values.push(acc_yr_id);
    }

    if (course_id) {
      where += " AND cu.course_id = ?";
      order_by += " , r.date_time DESC";
      extra_join +=
        " LEFT JOIN employees emp ON emp.id = r.uploaded_by_id LEFT JOIN salutations sal ON sal.id = emp.salutation_id LEFT JOIN employees emp2 ON emp2.id = r.cw_uploaded_by";
      extra_select +=
        "  ,CONCAT(sal.salutation_code, ' ', emp.surname, ' ', emp.other_names) AS uploaded_by_user ,CONCAT(sal.salutation_code, ' ', emp2.surname, ' ', emp2.other_names) AS cw_uploaded_by_user";
      values.push(course_id);
    }

    if (student_no) {
      where += " AND r.student_no = ?";
      values.push(student_no);
    }

    if (module_id) {
      where += " AND r.module_id = ?";
      values.push(module_id);
    }

    if (version_id) {
      where += " AND cu.course_version_id = ?";
      values.push(version_id);
    }

    if (entry_acc_yr) {
      extra_join += " LEFT JOIN students std ON std.student_no = r.student_no";
      where += " AND std.entry_acc_yr = ?";
      values.push(entry_acc_yr);
    }

    if (uploaded_by) {
      where += " AND r.uploaded_by_id = ?";
      values.push(uploaded_by);
    }

    if (cw_uploaded_by) {
      where += " AND r.cw_uploaded_by = ?";
      values.push(cw_uploaded_by);
    }

    if (study_yr) {
      where += " AND r.study_yr = ?";
      values.push(study_yr);
    }

    if (sem) {
      where += " AND r.semester = ?";
      values.push(sem);
    }

    if (student_nos && Array.isArray(student_nos) && student_nos.length > 0) {
      const placeholders = student_nos.map(() => "?").join(",");
      where += ` AND r.student_no IN (${placeholders})`;
      values.push(...student_nos);
    }

    if (
      course_units &&
      Array.isArray(course_units) &&
      course_units.length > 0
    ) {
      const placeholders = course_units.map(() => "?").join(",");
      where += ` AND r.module_id IN (${placeholders})`;
      values.push(...course_units);
    }

    // Query
    const sql = `
      SELECT 
        r.*,
        cu.course_unit_code,
        cu.course_unit_title,
        cu.credit_units,
        cu.grading_id,
        gd.grade_letter AS grade,
        gd.grade_point,
        ay.acc_yr_title,
        COALESCE(ROUND(r.final_mark, 0), ROUND(COALESCE(r.coursework, 0) + COALESCE(r.exam, 0), 0)) AS final_mark
        ${extra_select}
    FROM 
        results r
    LEFT JOIN 
        course_units cu ON cu.id = r.module_id
    LEFT JOIN 
        acc_yrs ay ON r.acc_yr_id = ay.id
    ${extra_join}
    LEFT JOIN 
        grading_system_details gd 
        ON gd.grading_system_id = cu.grading_id 
          AND COALESCE(ROUND(r.final_mark, 0), ROUND(COALESCE(r.coursework, 0) + COALESCE(r.exam, 0), 0)) BETWEEN gd.min_value AND gd.max_value 
          AND gd.deleted = 0
      ${where}
      ORDER BY study_yr ASC, semester ASC ${order_by}
      LIMIT ? OFFSET ?;
    `;

    // Add limit and start to the values array
    values.push(limit, start);

    // Execute query
    const [rows] = await db.execute(sql, values);
    // console.log("rows", rows)
    return rows;
  } catch (error) {
    console.error("Error fetching student marks:", error, {
      student_no,
      module_id,
      student_nos,
    });
    throw new GraphQLError("Error fetching student marks.");
  }
};

const getResultsConfig = async ({ setting_name }) => {
  try {
    let where = "";
    let values = [];

    if (setting_name) {
      where += " AND setting_name = ?";
      values.push(setting_name);
    }

    let sql = `SELECT * FROM settings WHERE deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching settings...", error.message);
  }
};

const uploadMarks = async (uploadType, user_id, args) => {
  try {
    // first verify the code
    const [codeResponse] = await getOTP({
      user_id,
      _module: "results",
      otp_code: args.security_code,
    });

    if (!codeResponse) {
      throw new GraphQLError("Invalid Security Code!");
    }

    // check if the code is expired
    if (new Date() > new Date(codeResponse.expires_at)) {
      // expired
      throw new GraphQLError("Expired Security Code!");
    }

    let errors = [];

    // get user details
    const [userDetails] = await getEmployees({
      id: user_id,
      active: true,
    });

    if (!userDetails) {
      throw new GraphQLError("User Not Found!");
    }

    for (const mrk of args.payload) {
      const { student_no, course_unit_code, marks } = mrk;

      const [studentDetails] = await getStudents({
        std_no: student_no,
      });

      if (!studentDetails) {
        errors.push({
          student_no: student_no,
          message: "Student not found",
        });
        continue;
      }

      const [running_sem] = await getRunningSemesters({
        intake_id: studentDetails.intake_id,
      });

      if (!running_sem) {
        errors.push({
          student_no: student_no,
          message: "Running semester not found",
        });
        continue;
      }

      const [module_details] = await getCourseUnits({
        course_unit_code: course_unit_code,
        course_id: studentDetails.course_id,
        course_version_id: studentDetails.course_version_id,
      });

      if (!module_details) {
        errors.push({
          student_no: student_no,
          message: `Course unit not found: ${course_unit_code}`,
        });
        continue;
      }

      // lets check for an existing coursework record
      const [std_mk] = await getStdResults({
        student_no: student_no,
        module_id: module_details.id,
      });

      let data;

      if (uploadType == "coursework") {
        if (std_mk?.coursework) {
          errors.push({
            student_no: student_no,
            message: `Student already has course work marks for this module: ${module_details.course_unit_code}`,
          });
          continue;
        }

        data = {
          student_no,
          acc_yr_id: running_sem.acc_yr_id,
          module_id: module_details.id,
          study_yr: module_details.course_unit_year,
          semester: module_details.course_unit_sem,
          coursework: marks,
          cw_uploaded_by: user_id,
          uploaded_by_id: user_id,
          cw_uploaded_at: new Date(),
        };
      } else if (uploadType == "exam") {
        if (!std_mk?.coursework) {
          errors.push({
            student_no: student_no,
            message: `Student doesn't have course work marks for this module: ${module_details.course_unit_code}`,
          });
          continue;
        }

        if (std_mk?.exam) {
          errors.push({
            student_no: student_no,
            message: `Student already has exam marks for this module: ${module_details.course_unit_code}`,
          });
          continue;
        }

        data = {
          student_no,
          acc_yr_id: running_sem.acc_yr_id,
          module_id: module_details.id,
          study_yr: module_details.course_unit_year,
          semester: module_details.course_unit_sem,
          exam: marks,
          uploaded_by_id: user_id,
          date_time: new Date(),
        };
      }

      const save_id = await saveData({
        table: "results",
        data,
        idColumn: "result_id",
        id: std_mk?.result_id,
      });
    }

    if (errors.length > 0) {
      // there are errors
      // Notify the user about upload errors
      let emailBody = `<p>Dear User,</p><p>The following students had issues:</p><ul>`;

      errors.forEach((err) => {
        emailBody += `<li>Student No: <strong>${err.student_no}</strong> - ${err.message}</li>`;
      });

      emailBody += `</ul><p>Regards,</p><p>Results Management Team</p>`;

      // send emails
      await sendEmail({
        to: userDetails.email,
        subject:
          uploadType == "coursework"
            ? "Coursework Upload Errors"
            : "Final Exam Results Upload Errors",
        html: emailBody,
      });

      if (errors.length == args.payload.length) {
        // all students have errors

        return {
          success: false,
          message:
            uploadType == "coursework"
              ? "Failed to upload course work marks for students, The details have been sent to your email."
              : "Failed to upload Final Exam marks for students, The details have been sent to your email.",
        };
      } else {
        return {
          success: false,
          message:
            uploadType == "coursework"
              ? "Some students in the uploaded list have issues, The details about these students have been sent to your email."
              : "Some students in the uploaded list have issues, The details about these students have been sent to your email.",
        };
      }
    } else {
      // send an email to the uploader
      await sendEmail({
        to: userDetails.email,
        subject:
          uploadType == "coursework"
            ? "Coursework Marks Uploaded Successfully"
            : "Final Exam Marks Uploaded Successfully",
        message:
          uploadType == "coursework"
            ? "Course Work Marks uploaded successfully!"
            : "Final Exam Marks uploaded successfully!",
      });
      // there are no error
      return {
        success: true,
        message:
          uploadType == "coursework"
            ? "Students Course Work Marks Uploaded Successfully"
            : "Students Final Exam Marks Uploaded Successfully",
      };
    }
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError(error.message);
  }
};

const studentMarksRessolvers = {
  Query: {
    student_marks: async (parent, args) => {
      const result = await getStdResults({
        student_no: args.student_no,
        limit: args.limit,
        start: args.start,
      });

      // console.log("results", result);
      const resultsWithGrades = calculateGrades(result);
      // console.log("result", resultsWithGrades);
      return resultsWithGrades;
    },
    get_student_marks: async (parent, args) => {
      const result = await getStudents({
        std_no: args.student_no,
      });

      return result[0];
    },
    std_marks: async (parent, args) => {
      const result = await getStudents({
        std_no: args.student_nos,
      });

      return result;
    },
    get_result_config: async (parent, args) => {
      const results = await getResultsConfig({
        setting_name: "results_config",
      });

      let settingValue = null;

      if (results.length > 0) {
        const setting = results[0];
        settingValue = JSON.parse(setting.setting_value);

        const accYrId = settingValue.acc_yr_id;
        const campusId = settingValue.campus_id;
        const intakeId = settingValue.intake;

        const [acc_yr] = await getAccYrs({
          id: accYrId,
        });

        const [campus] = await getCampus({
          id: campusId,
        });

        let intake;
        let intake_id;
        let study_time;
        let study_time_id;

        if (intakeId == "all") {
          intake = "all";
          intake_id = null;
        } else {
          const [res] = await getIntake({
            id: intakeId,
          });

          intake = res.intake_title;
          intake_id = res.id;
        }

        if (settingValue.study_time == "all") {
          study_time = "all";
          study_time_id = null;
        } else {
          const [res2] = await getStudyTime({
            id: settingValue.study_time,
          });

          study_time = res2.study_time_title;
          study_time_id = res2.id;
        }

        settingValue.acc_yr = acc_yr.acc_yr_title;
        settingValue.acc_yr_id = acc_yr.id;
        settingValue.campus = campus.campus_title;
        settingValue.campus_id = campus.id;
        settingValue.intake = intake;
        settingValue.intake_id = intake_id;
        settingValue.study_time = study_time;
        settingValue.study_time_id = study_time_id;
      }
      // we need to parse the json

      // console.log("result", setting);

      return settingValue;
    },
    results: async (parent, args) => {
      const {
        course_id,
        course_version_id,
        acc_yr_id,
        campus_id,
        intake,
        study_time,
        study_yr,
        sem,
      } = args.payload;

      // console.log("the payload", args.payload);

      // lets first focus on the courseunits which will work as columns in the frontend
      const courseunits = await getCourseUnits({
        course_version_id,
        course_id,
        study_yr,
        sem,
      });

      // console.log("course units", courseunits);

      // now i need students and their marks -> students in that entry acc_yr, intake, campus, study_time
      const students = await getStudents({
        acc_yr_id,
        intake_id: intake,
        campus_id,
        study_time,
        course_version_id,
      });

      // console.log("the students", students);

      return {
        course_units: courseunits,
        students_marks: students,
      };

      // now that i have the students in that academic year, i need their results with respect to the courseunits returned earlier
      // const results = await getStdResults({
    },
    load_results_history: async (parent, args) => {
      try {
        const {
          acc_yr_id,
          course_id,
          study_yr,
          sem,
          course_unit_id,
          entry_acc_yr,
          student_no,
          upload_type,
          uploaded_by_id,
          version_id,
          start,
          limit,
        } = args.payload;

        // lets fetch students history
        const history = await getStdResults({
          acc_yr_id,
          course_id,
          study_yr,
          module_id: course_unit_id,
          uploaded_by: uploaded_by_id,
          cw_uploaded_by: upload_type == "course_work" ? uploaded_by_id : null,
          version_id,
          student_no,
          entry_acc_yr,
          sem,
          start,
          limit,
        });

        return history;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  StudentMark: {
    student_info: async (parent, args) => {
      const [student_details] = await getStudents({
        std_no: parent.student_no,
      });

      return student_details;
    },
  },
  Mutation: {
    bulkActiveStudentsResultsUpload: async (parent, args, context) => {
      const user_id = await context.req.user.id;
      const BATCH_SIZE = 100; // Define a reasonable batch size
      const payload = args.payload;

      if (!Array.isArray(payload) || payload.length === 0) {
        throw new GraphQLError("Payload must be a non-empty array.");
      }

      const connection = await db.getConnection();
      try {
        // Cache for already fetched or created records
        const moduleCache = new Map();
        const accYrCache = new Map();
        const employeeCache = new Map();

        const batches = [];
        for (let i = 0; i < payload.length; i += BATCH_SIZE) {
          batches.push(payload.slice(i, i + BATCH_SIZE));
        }

        for (const batch of batches) {
          await connection.beginTransaction();
          // console.log("batch", batch)

          // Collect all unique values needed for batch processing
          // const moduleCodes = [...new Set(batch.map((r) => r.module_code))];
          const accYrs = [...new Set(batch.map((r) => r.acc_yr))];
          const uploadedBys = [...new Set(batch.map((r) => r.uploaded_by))];
          const studentNos = [...new Set(batch.map((r) => r.student_no))];

          // Pre-fetch modules
          for (const course_unit of batch) {
            // Fetch the student details
            // console.log("course unit", course_unit);
            const [studentDetails] = await getStudents({
              std_no: course_unit.student_no,
            });

            // console.log("student", studentDetails);

            if (!studentDetails)
              throw new Error(
                `Student with student_no ${course_unit.student_no} not found`
              );

            // console.log("payload", {
            //   course_unit_code: course_unit.module_code,
            //   course_id: studentDetails.course_id,
            //   course_version_id: studentDetails.course_version_id,
            //   course_unit_title: course_unit.module_title,
            // });

            const [module] = await getCourseUnits({
              course_unit_code: course_unit.module_code,
              course_id: studentDetails.course_id,
              course_version_id: studentDetails.course_version_id,
              course_unit_title: course_unit.module_title,
            });

            // console.log("module", module);

            if (!module)
              throw new Error(
                `Module ${course_unit.module_code} - ${course_unit.module_title} for student ${course_unit.student_no} not found`
              );

            const cacheKey = `${course_unit.module_code}-${course_unit.module_title}`;
            moduleCache.set(cacheKey, module);
            // moduleCache.set(course_unit.module_code, module);

            // if (!moduleCache.has(code)) {
            //   // const _module = batch.find((r) => r.module_code === code);

            //   console.log("batch", batch);

            //   // if (!_module)
            //   //   throw new Error(`No student found for module code ${code}`);

            //   console.log("student details", studentDetails);

            //   if (!studentDetails)
            //     throw new Error(
            //       `Student with student_no ${student.student_no} not found`
            //     );

            //   // console.log("payload", {
            //   //   course_unit_code: code,
            //   //   course_id: studentDetails.course_id,
            //   //   course_version_id: studentDetails.course_version_id,
            //   //   course_unit_title: _module.module_title,
            //   // });

            //   // Fetch the module using course_id from the student's details

            //   // console.log("module", module);

            // }
          }

          // Pre-fetch or create academic years
          for (const accYr of accYrs) {
            if (!accYrCache.has(accYr)) {
              const accYrId = await fetchOrCreateRecord({
                table: "acc_yrs",
                field: "acc_yr_title",
                value: accYr,
                user_id,
              });
              accYrCache.set(accYr, accYrId);
            }
          }

          // Pre-fetch employees
          for (const name of uploadedBys) {
            if (!employeeCache.has(name)) {
              const nameWithoutTitle = name
                .replace(/^(DR\.|MR\.|MS\.|MRS\.\s*)/i, "")
                .trim();
              const nameParts = nameWithoutTitle.split(" ");
              const surname = nameParts[0];
              const otherNames = nameParts.slice(1).join(" ");

              const [employee] = await getEmployees({
                surname,
                other_names: otherNames,
              });

              // console.log("payload", {
              //   surname,
              //   other_names: otherNames,
              // });

              // console.log("employee", employee);
              if (!employee) throw new Error(`Employee ${name} not found`);
              employeeCache.set(name, employee);
            }
          }

          // Pre-check for existing marks in batch
          const existingMarks = await getStdMarks({ student_nos: studentNos });

          const existingMarksSet = new Set(
            existingMarks.map((mark) => `${mark.student_no}-${mark.module_id}`)
          );

          const resultsData = [];

          for (const r of batch) {
            const cacheKey = `${r.module_code}-${r.module_title}`;
            const module = moduleCache.get(cacheKey);
            // const module = moduleCache.get(r.module_code);
            const accYrId = accYrCache.get(r.acc_yr);
            const employee = employeeCache.get(r.uploaded_by);

            const dateParts = r.datetime.split(" ");
            const formattedDate = new Date(dateParts.slice(1).join("-"));

            const key = `${r.student_no}-${module.id}`;
            if (!existingMarksSet.has(key)) {
              resultsData.push({
                student_no: r.student_no,
                module_id: module.id,
                acc_yr_id: accYrId,
                study_yr: r.study_yr,
                semester: r.sem,
                coursework: r.cswk,
                exam: r.exam,
                final_mark: r.final_mark,
                booklet_number: r.booklet_number,
                retake_count: r.no_of_retakes,
                uploaded_by_id: employee.id,
                migration_type: "active",
                date_time: formattedDate,
              });
            }
          }

          if (resultsData.length > 0) {
            await saveData({
              table: "results",
              data: resultsData,
            });
          }

          await connection.commit();
        }

        return {
          success: true,
          message: `${payload.length} records processed successfully.`,
        };
      } catch (error) {
        await connection.rollback();
        throw new GraphQLError(error.message);
      } finally {
        if (connection) connection.release();
      }
    },
    saveResultsConfig: async (parent, args) => {
      // console.log("args", args.payload);
      try {
        const data = {
          setting_name: "results_config",
          setting_value: JSON.stringify(args.payload),
        };

        await saveData({
          table: "settings",
          data,
          id: "results_config",
          idColumn: "setting_name",
        });

        return {
          success: "true",
          message: "Settings Saved Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    uploadCourseWorkMarks: async (parent, args, context) => {
      try {
        const user_id = context.req.user.id;

        const result = await uploadMarks("coursework", user_id, args);
        return result;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    uploadFinalExamMarks: async (parent, args, context) => {
      try {
        const user_id = context.req.user.id;

        const result = await uploadMarks("exam", user_id, args);
        return result;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    sendResultsUploadVerificationCode: async (parent, args, context) => {
      const user_id = context.req.user.id;
      try {
        const [userDetails] = await getEmployees({
          id: user_id,
        });

        if (!userDetails) {
          throw new GraphQLError("Invalid User!");
        }

        // send a verification message to enable the user to upload results
        const otp_code = Math.floor(100000 + Math.random() * 900000);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // expires in 5 minutes

        const otpData = {
          user_id: user_id,
          otp_code: otp_code,
          module: "results",
          expires_at: expiresAt,
        };

        await saveData({
          table: "otps",
          data: otpData,
          id: null,
        });

        await sendEmail({
          to: userDetails.email,
          subject: "Tredumo Verification Code for Results Upload",
          message: `You have initiated an action for results upload. Your verification code is ${otp_code}`,
        });

        return {
          success: true,
          message: "Results security code sent successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default studentMarksRessolvers;
