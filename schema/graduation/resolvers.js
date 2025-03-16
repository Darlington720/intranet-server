import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { getStudents } from "../student/resolvers.js";
import {
  getMissingMarks,
  getStdMarks,
  getStdResults,
} from "../student_marks/resolvers.js";
import { getCourseUnits } from "../course_unit/resolvers.js";
import saveData from "../../utilities/db/saveData.js";
import { getGraduationSessions } from "../graduation_session/resolvers.js";
import { getStudentEnrollment } from "../student_enrollment/resolvers.js";
import calculateGrades from "../../utilities/helpers/calculateGrades.js";
import { getCourseVersionDetails } from "../course/resolvers.js";
import saveDataWithOutDuplicates from "../../utilities/db/saveDataWithOutDuplicates.js";
import sendEmail from "../../utilities/emails/email-otp.js";
import { getRunningSemesters } from "../academic_schedule/resolvers.js";

const getGraduationSections = async ({
  section_key,
  is_resident,
  level_id,
  limit,
}) => {
  try {
    let conditions = ["deleted = 0"];
    let values = [];

    if (section_key) {
      conditions.push("section_key = ?");
      values.push(section_key);
    }

    if (is_resident !== undefined) {
      conditions.push("for_residents = ?");
      values.push(is_resident);
    }

    if (level_id) {
      conditions.push("(level_id = ? OR level_id IS NULL)");
      values.push(level_id);
    }

    if (limit) {
    }

    let sql = `SELECT * FROM graduation_sections WHERE ${conditions.join(
      " AND "
    )} ORDER BY graduation_sections.sort ASC ${limit ? `LIMIT ${limit}` : ""}`;

    const [results] = await db.execute(sql, values);
    return results;
  } catch (error) {
    console.error("Error fetching graduation sections:", error);
    throw new GraphQLError("Error fetching graduation sections!");
  }
};

const getGraduationStatistics = async () => {
  // filter those who graduated
  let totals_sql = `
   SELECT COUNT(*) AS total_eligible_students 
    FROM (
        SELECT 
            r.student_no,
            SUM(COALESCE(cu.credit_units, 0)) AS total_credit_units,
            cv.total_credit_units AS required_credit_units
        FROM results r
        INNER JOIN students std ON r.student_no = std.student_no
        INNER JOIN course_versions cv ON cv.id = std.course_version_id
        LEFT JOIN course_units cu ON cu.id = r.module_id
        LEFT JOIN grading_system_details gd 
            ON gd.grading_system_id = cu.grading_id 
            AND COALESCE(ROUND(r.final_mark, 0), ROUND(COALESCE(r.coursework, 0) + COALESCE(r.exam, 0), 0)) 
                BETWEEN gd.min_value AND gd.max_value 
            AND gd.deleted = 0
        WHERE r.deleted = 0
        GROUP BY r.student_no, cv.total_credit_units
        HAVING total_credit_units >= required_credit_units
    ) AS eligible_students;
  `;

  let total_cleared = `
    SELECT COUNT(*) AS total_cleared_students 
      FROM (
          SELECT 
              std.student_no
          FROM students std
          WHERE std.deleted = 0 AND std.has_cleared = 1
      ) AS cleared_students;
  `;

  let faculty_breakdown_sql = `
        SELECT 
    sch.school_code,
    COUNT(DISTINCT r.student_no) AS total_students,
    SUM(COALESCE(cu.credit_units, 0)) AS total_credit_units,
    cv.total_credit_units AS required_credit_units
    FROM results r
    INNER JOIN students std ON r.student_no = std.student_no
    INNER JOIN course_versions cv ON cv.id = std.course_version_id
    LEFT JOIN course_units cu ON cu.id = r.module_id
    LEFT JOIN courses c ON c.id = std.course_id
    LEFT JOIN schools sch ON sch.id = c.school_id
    LEFT JOIN grading_system_details gd 
        ON gd.grading_system_id = cu.grading_id 
        AND COALESCE(ROUND(r.final_mark, 0), ROUND(COALESCE(r.coursework, 0) + COALESCE(r.exam, 0), 0)) 
            BETWEEN gd.min_value AND gd.max_value 
        AND gd.deleted = 0
    WHERE r.deleted = 0
    GROUP BY sch.school_code
    HAVING SUM(COALESCE(cu.credit_units, 0)) >= cv.total_credit_units;

  `;

  const [total_eligible_students] = await db.execute(totals_sql);
  const [total_cleared_students] = await db.execute(total_cleared);
  const [total_elligible_students_by_sch] = await db.execute(
    faculty_breakdown_sql
  );

  // console.log(
  //   "total_elligible_students_by_sch",
  //   total_elligible_students_by_sch
  // );

  return {
    total_eligible_students: total_eligible_students[0].total_eligible_students,
    total_cleared_students: total_cleared_students[0].total_cleared_students,
    faculty_breakdown: total_elligible_students_by_sch,
  };
};

const getStudentClearanceLogs = async ({ student_no, section_id }) => {
  let where = "";
  let values = [];

  if (student_no) {
    where += " AND students_clearance_logs.student_no = ?";
    values.push(student_no);
  }

  if (section_id) {
    where += " AND students_clearance_logs.section_id = ?";
    values.push(section_id);
  }

  let sql = `
    SELECT 
    students_clearance_logs.*,
    graduation_sections.title AS graduation_section_title
    FROM 
        students_clearance_logs
    LEFT JOIN 
        graduation_sections ON graduation_sections.id = students_clearance_logs.section_id
    WHERE 
        students_clearance_logs.deleted = 0 ${where}
    `;

  const [result] = await db.execute(sql, values);

  return result;
};

const getGraduationStudentsDetails = async () => {
  let sql = `
  SELECT 
    std.*,
    r.student_no,
    SUM(cu.credit_units) AS total_credit_units,
    cv.total_credit_units AS required_credit_units
FROM results r
INNER JOIN students std ON r.student_no = std.student_no
INNER JOIN course_versions cv ON cv.id = std.course_version_id
LEFT JOIN course_units cu ON cu.id = r.module_id
LEFT JOIN grading_system_details gd 
    ON gd.grading_system_id = cu.grading_id 
    AND COALESCE(ROUND(r.final_mark, 0), ROUND(COALESCE(r.coursework, 0) + COALESCE(r.exam, 0), 0)) 
        BETWEEN gd.min_value AND gd.max_value 
    AND gd.deleted = 0
WHERE r.deleted = 0 
GROUP BY r.student_no, cv.total_credit_units
HAVING SUM(cu.credit_units) >= cv.total_credit_units
LIMIT 1000;
`;

  let [results] = await db.execute(sql);

  return results;
};

const getClearanceStudents = async ({ section_id }) => {
  let where = "";
  let values = [];

  if (section_id) {
    where += " AND students_clearance_logs.section_id = ?";
    values.push(section_id);
  }

  let sql = `
    SELECT 
      acc_yrs.acc_yr_title,
      students_clearance_logs.*
      FROM
      students_clearance_logs 
      LEFT JOIN acc_yrs ON acc_yrs.id = students_clearance_logs.acc_yr_id
      WHERE students_clearance_logs.deleted = 0 ${where}
  `;

  let [results] = await db.execute(sql, values);

  return results;
};

const getRejectionLogs = async ({ clearance_id }) => {
  try {
    let where = "";
    let values = [];

    if (clearance_id) {
      where += " AND clearance_id = ?";
      values.push(clearance_id);
    }

    let sql = `
    SELECT 
      clearance_rejection_logs.*,
      CONCAT(salutations.salutation_code, ' ', employees.surname, ' ', employees.other_names) AS rejected_by_user
      FROM 
      clearance_rejection_logs
      LEFT JOIN employees ON clearance_rejection_logs.rejected_by = employees.id
      LEFT JOIN salutations ON salutations.id = employees.salutation_id
      WHERE clearance_rejection_logs.deleted = 0 ${where} ORDER BY clearance_rejection_logs.id DESC`;

    const [results] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching rejection logs");
  }
};

const getStudentNextClearanceStage = async ({
  current_section_id,
  is_resident,
  level_id,
}) => {
  try {
    const graduationStages = await getGraduationSections({
      is_resident,
      level_id,
    });

    if (graduationStages.length == 0) {
      throw new GraphQLError("No Stage found!");
    }

    const currentStageDetails = graduationStages.find(
      (stage) => stage.section_id == current_section_id
    );

    // filter out all stages above the current
    const remainingStages = graduationStages.filter(
      (stage) => stage.sort > currentStageDetails.sort
    );

    return remainingStages[0];
  } catch (error) {
    throw new GraphQLError(error.message);
  }
};

const graduationSectionRessolvers = {
  Query: {
    graduation_sections: async (parent, args, context) => {
      const student_no = context.req.user.student_no;

      // get active graduation settings
      const [activeGrad] = await getGraduationSessions({
        active: true,
      });

      if (!activeGrad) {
        throw new GraphQLError("No active graduation found!");
      }

      // console.log("activeGrad", activeGrad);

      const [studentDetails] = await getStudents({
        std_no: student_no || null,
        get_course_details: true,
      });

      const result = await getGraduationSections({
        is_resident: studentDetails?.is_resident,
        level_id: studentDetails?.level || null,
      });

      return {
        graduation_details: activeGrad,
        graduation_sections: result,
      };
    },
    // _check_graduation_elligibility: async (parent, args, context) => {
    //   const student_no = context.req.user.student_no;
    //   let has_missed_papers = false;
    //   let has_retakes = false;

    //   const [studentDetails] = await getStudents({
    //     std_no: student_no,
    //   });

    //   // get student results
    //   const studentMarks = await getStdResults({
    //     student_no: student_no,
    //   });

    //   // then the course units
    //   const courseUnits = await getCourseUnits({
    //     course_version_id: studentDetails.course_version_id,
    //     course_id: studentDetails.course_id,
    //   });

    //   const missingMarks = courseUnits.filter(
    //     (unit) => !studentMarks.some((mark) => mark.module_id === unit.id)
    //   );

    //   const removedElectiveUnits = missingMarks.filter(
    //     (mark) => mark.course_unit_level != "elective"
    //   );

    //   // filtering retakes from the alreaady done subjects
    //   const retakes = studentMarks.filter((mark) => mark.grade == "F");

    //   // console.log("missingMarks", removedElectiveUnits);
    //   // console.log("retakes", retakes);

    //   if (removedElectiveUnits.length > 0 || studentMarks.length == 0) {
    //     has_missed_papers = true;
    //   }

    //   if (retakes.length > 0) {
    //     has_retakes = true;
    //   }

    //   return {
    //     has_missed_papers,
    //     has_retakes,
    //   };
    // },
    check_graduation_elligibility: async (parent, args, context) => {
      const student_no = context.req.user.student_no;

      try {
        const [studentDetails] = await getStudents({
          std_no: student_no,
        });

        if (!studentDetails)
          throw new GraphQLError("Failed to locate student!");

        // get the course version details
        const course_version_details = await getCourseVersionDetails({
          course_version_id: studentDetails.course_version_id,
        });

        const result = await getStdResults({
          student_no: student_no,
          limit: 50,
          start: 0,
        });

        const resultsWithGrades = calculateGrades(result);

        // console.log("resultsWithGrades", resultsWithGrades);

        const retakes = resultsWithGrades.filter((mark) => mark.grade == "F");

        let isElligible = false;
        let has_retakes = false;

        if (resultsWithGrades[resultsWithGrades.length - 1]) {
          if (
            resultsWithGrades[resultsWithGrades.length - 1].CTCU_noF >=
            course_version_details.total_credit_units
          ) {
            isElligible = true;
          }
        }

        if (retakes.length > 0) {
          has_retakes = true;
        }

        return {
          is_elligible: isElligible,
          has_retakes,
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    // load_graduation_data: async (parent, args) => {
    //   // get all the current graduation session
    //   const [activeGradSession] = await getGraduationSessions({
    //     active: true,
    //   });

    //   // look for the students that have enrolled in that acc_yr
    //   const studentsEnrolledInThisAccYr = await getStudentEnrollment({
    //     acc_yr: activeGradSession.acc_yr_id,
    //   });

    //   // console.log("studentsEnrolledInThisAccYr", studentsEnrolledInThisAccYr);

    //   let elligibleStds = [];

    //   for (const student of studentsEnrolledInThisAccYr) {
    //     let has_missed_papers = false;
    //     let has_retakes = false;

    //     const [studentDetails] = await getStudents({
    //       std_no: student.stdno,
    //     });

    //     // get student results
    //     const studentMarks = await getStdResults({
    //       student_no: student.stdno,
    //     });

    //     // then the course units
    //     const courseUnits = await getCourseUnits({
    //       course_version_id: studentDetails.course_version_id,
    //       course_id: studentDetails.course_id,
    //     });

    //     const missingMarks = courseUnits.filter(
    //       (unit) => !studentMarks.some((mark) => mark.module_id === unit.id)
    //     );

    //     const removedElectiveUnits = missingMarks.filter(
    //       (mark) => mark.course_unit_level != "elective"
    //     );

    //     // filtering retakes from the alreaady done subjects
    //     const retakes = studentMarks.filter((mark) => mark.grade == "F");

    //     // console.log("missingMarks", removedElectiveUnits);
    //     // console.log("retakes", retakes);

    //     if (removedElectiveUnits.length > 0 || studentMarks.length == 0) {
    //       has_missed_papers = true;
    //     }

    //     if (retakes.length > 0) {
    //       has_retakes = true;
    //     }

    //     const isElligible = !has_missed_papers && !has_retakes;

    //     if (isElligible) {
    //       elligibleStds.push(studentDetails);
    //     }
    //   }

    //   console.log("elligibleStds", elligibleStds);
    // },
    load_graduation_data: async (parent, args, context) => {
      try {
        const graduation_statistics = await getGraduationStatistics();

        return graduation_statistics;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    getGraduationStudents: async (parent, args, context) => {
      try {
        const graduation_stds = await getGraduationStudentsDetails();

        return graduation_stds;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    library_clearance_students: async (parent, args, context) => {
      // const user_id = context
      try {
        // get the library section id
        const [library_section] = await getGraduationSections({
          section_key: "library",
        });

        if (!library_section) {
          throw new GraphQLError("Library section not found!");
        }

        const result = await getClearanceStudents({
          section_id: library_section.id,
        });

        // console.log("result", result);

        return result;
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
  GraduationSection: {
    logs: async (parent, args, context) => {
      // view logs for each student
      const student_no = context.req.user.student_no;
      const section_id = parent.id;

      const clearance_logs = await getStudentClearanceLogs({
        student_no,
        section_id,
      });

      return clearance_logs;
    },
  },
  ClearanceLog: {
    student_details: async (parent, args) => {
      try {
        const student_no = parent.student_no;

        const [student_details] = await getStudents({
          std_no: student_no,
        });

        if (!student_details) {
          throw new GraphQLError("Failed to get student detaails!");
        }

        // console.log("student details", student_details);

        return student_details;
      } catch (error) {
        throw new GraphQLError("Failed to get student details!");
      }
    },
    rejection_logs: async (parent, args) => {
      try {
        const clearance_id = parent.id;

        const rejection_logs = await getRejectionLogs({
          clearance_id,
        });

        return rejection_logs;
      } catch (error) {
        throw new GraphQLError("Failed to get student details!");
      }
    },
  },
  Mutation: {
    verify_student_credentials: async (parent, args, context) => {
      const student_no = context.req.user.student_no;
      const {
        surname,
        othernames,
        email,
        phone_no,
        place_of_residence,
        date_of_birth,
        gender,
        country_of_origin,
        nationality,
        acc_yr_id,
      } = args.payload;
      try {
        // use the student number to get the applicant id
        const [student] = await getStudents({
          std_no: student_no,
          fetchStdBio: true,
          get_course_details: true,
        });

        // console.log(student);

        if (!student) {
          throw new GraphQLError("Failed to get Student!");
        }

        // lets first fetch the student appropriate sections arranged in ascending order
        const clearance_sections = await getGraduationSections({
          is_resident: student.is_resident,
          level_id: student.level,
          limit: 1,
        });

        if (clearance_sections.length == 0) {
          throw new GraphQLError("Clearance Sections Not yet defined!");
        }

        // save data in the applicants table
        const data = {
          surname,
          other_names: othernames,
          email,
          phone_no,
          nationality_id: nationality,
          date_of_birth,
          gender,
          place_of_residence,
          country_of_origin,
          verified_credentials: true,
          credentials_verified_on: new Date(),
          credentials_verified_by: `${student.surname} ${student.other_names}`,
        };

        // lets update the students table
        const studentClearanceData = {
          graduation_status: "in_progress",
        };

        // add the initial clearance step
        const initialClearanceRecord = {
          student_no,
          section_id: clearance_sections[0].id,
          status: "pending",
          acc_yr_id,
          created_on: new Date(),
        };

        await saveData({
          table: "applicants",
          data,
          id: student.applicant_id,
        });

        await saveData({
          table: "students",
          data: studentClearanceData,
          id: student_no,
          idColumn: "student_no",
        });

        await saveData({
          table: "students_clearance_logs",
          data: initialClearanceRecord,
          id: null,
        });

        return {
          success: true,
          message: "Credentials saved Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    clearStudentForGraduation: async (parent, args, context) => {
      const user_id = context.req.user.id;
      try {
        const { clearance_id, status, reason, student_no } = args.payload;

        const [student_details] = await getStudents({
          std_no: student_no,
          fetchStdBio: true,
          get_course_details: true,
        });

        if (!student_details) {
          throw new GraphQLError("Student Not Found!");
        }

        // get the running ac_yr
        const running_sem = await getRunningSemesters({
          intake_id: student_details.intake_id,
        });

        if (!running_sem) {
          throw new GraphQLError("Failed to get Runningg Semester");
        }

        // let first fetch the clearance record
        const [clearance_record] = await getStudentClearanceLogs({
          student_no,
          section_id: clearance_id,
        });

        if (!clearance_record) {
          throw new GraphQLError("Student Not elligible for clearance!");
        }

        // based on status
        if (status == "cleared") {
          // handle cleared

          // we need to continue the general form transportation
          const formData = {
            graduation_status: "in_progress",
          };

          await saveData({
            table: "students",
            data: formData,
            id: student_no,
            idColumn: "student_no",
          });

          const data = {
            status: "cleared",
            cleared_by: user_id,
            date: new Date(),
          };

          const save_id = await saveData({
            table: "students_clearance_logs",
            data,
            id: clearance_record.id,
          });

          // detect student's next clearance stage and automatically created the record
          const nextStage = await getStudentNextClearanceStage({
            current_section_id: clearance_id,
            is_resident: student_details.is_resident,
            level_id: student_details.level,
          });

          if (!nextStage) {
            // student has completed all the clearance processes
            await sendEmail({
              to: student_details.email,
              subject: "Graduation Clearance Management System",
              message: `Hello ${student_details.surname} ${student_details.other_names},
                        \n\nCongragulations, This is to inform you that you have successfully completed the graduation Clearance Process. 
                        \n\n You can now head to the gowns department to get your university gown.
                        \n\n  Kindly go to your student portal to view the details.`,
            });
            return;
          }

          const nextStageData = {
            student_no,
            section_id: nextStage.section_id,
            acc_yr_id: running_sem.acc_yr_id,
            status: "pending",
            created_on: new Date(),
          };

          await saveData({
            table: "students_clearance_logs",
            data: nextStageData,
          });

          // send an email to student inform them about the form progress
          await sendEmail({
            to: student_details.email,
            subject: "Graduation Clearance Management System",
            message: `Hello ${student_details.surname} ${student_details.other_names},
                      \n\nCongragulations, This is to inform you that your form has been cleared in ${clearance_record.graduation_section_title} department. 
                      \n\n Your has now been sent to ${nextStage.title} department
                      \n\n  Kindly go to your student portal to view the details.`,
          });
        } else if (status == "rejected") {
          // handle rejection

          // we need to stop the general form transportation
          const formRejectionData = {
            graduation_status: "rejected",
          };

          await saveData({
            table: "students",
            data: formRejectionData,
            id: student_no,
            idColumn: "student_no",
          });

          const stdClearanceData = {
            status: "rejected",
          };

          const save_id = await saveData({
            table: "students_clearance_logs",
            data: stdClearanceData,
            id: clearance_record.id,
          });

          const stdRejectionData = {
            clearance_id: clearance_record.id,
            reject_reason: reason,
            rejected_by: user_id,
            rejected_at: new Date(),
          };

          await saveData({
            table: "clearance_rejection_logs",
            data: stdRejectionData,
            id: null,
          });

          // send an email inform the student about the rejection
          await sendEmail({
            to: student_details.email,
            subject: "Graduation Clearance Management System",
            message: `Hello ${student_details.surname} ${student_details.other_names},
                      \n\nThis is to inform you that your form has been rejected in ${clearance_record.graduation_section_title} department. 
                      \n\n Kindly go to your student portal to view the details.`,
          });
        } else {
          throw new GraphQLError("Invalid Status Code!");
        }

        return {
          success: true,
          message: "Student Cleared Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default graduationSectionRessolvers;
