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
} from "../invoice/resolvers.js";
import generateInvoiceNo from "../../utilities/generateInvoiceNo.js";
import { getOtherFees } from "../other_fee/resolvers.js";
import generateInvoiceNoForDeadSem from "../../utilities/generateInvoiceNoForDeadSem.js";
import generateEnrollmentToken from "../../utilities/generateToken.js";
import calculateNextEnrollment from "../../utilities/helpers/calculateNextEnrollment.js";
import { getStudentRegistrationHistory } from "../student_registration/resolvers.js";

function getIdealNextYearAndSem(currentYear, currentSem) {
  let nextYear = parseInt(currentYear);
  let nextSem = parseInt(currentSem);

  if (nextSem === 1) {
    nextSem = 2;
  } else if (nextSem === 2) {
    nextSem = 1;
    nextYear += 1;
  }

  return {
    nextYear,
    nextSem,
  };
}

export const getStudentEnrollment = async ({
  id,
  std_id,
  std_no,
  active_sem_id,
  enrollment_token,
  study_yr,
  sem,
  enrollment_status_id,
  exclude_dead_semesters,
  acc_yr,
  true_sem,
  limit,
  active,
}) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where += " AND students_enrollment.id = ?";
      values.push(id);
    }

    if (std_id) {
      where += " AND students_enrollment.std_id = ?";
      values.push(std_id);
    }

    if (enrollment_token) {
      where += " AND students_enrollment.enrollment_token = ?";
      values.push(enrollment_token);
    }

    if (std_no) {
      where += " AND students_enrollment.stdno = ?";
      values.push(std_no);
    }

    if (active_sem_id) {
      where += " AND students_enrollment.active_sem_id = ?";
      values.push(active_sem_id);
    }

    if (study_yr) {
      where += " AND students_enrollment.study_yr = ?";
      values.push(study_yr);
    }

    if (sem) {
      where += " AND students_enrollment.sem = ?";
      values.push(sem);
    }

    if (acc_yr) {
      where += " AND students_enrollment.acc_yr = ?";
      values.push(acc_yr);
    }

    if (true_sem) {
      where += " AND students_enrollment.true_sem = ?";
      values.push(true_sem);
    }

    if (active) {
      where += " AND students_enrollment.active = ?";
      values.push(active);
    }

    if (enrollment_status_id) {
      where += " AND students_enrollment.enrollment_status_id = ?";
      values.push(enrollment_status_id);
    }

    if (exclude_dead_semesters) {
      where += " AND students_enrollment.enrollment_status_id != ?";
      values.push(6);
    }

    const pagination = limit !== undefined ? `LIMIT ?` : "";
    if (pagination) {
      values.push(limit);
    }

    let sql = `SELECT students_enrollment.*, acc_yrs.acc_yr_title
    FROM students_enrollment 
    LEFT JOIN acc_yrs ON acc_yrs.id = students_enrollment.acc_yr
    WHERE students_enrollment.deleted = 0 ${where} ORDER BY students_enrollment.study_yr DESC, students_enrollment.datetime DESC, acc_yrs.acc_yr_title DESC, students_enrollment.sem ASC ${pagination}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching enrollment " + error.message);
  }
};

const studentEnrollmentResolvers = {
  Query: {
    student_enrollment_history: async (parent, args) => {
      const { student_id, student_no } = args;
      const result = await getStudentEnrollment({
        std_id: student_id,
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
    // enrollStudent: async (parent, args) => {
    //   const {
    //     student_id,
    //     student_no,
    //     study_yr,
    //     active_sem_id,
    //     enrollment_status,
    //     enrolled_by,
    //   } = args;

    //   const connection = await db.getConnection();
    //   await connection.beginTransaction();
    //   try {
    //     // get student details to be used to generate invoices
    //     const student = await getStudents({
    //       std_id: student_id,
    //       std_no: student_no,
    //       get_course_details: true,
    //     });

    //     if (!student[0]) throw new GraphQLError(`Failed to get student...`);

    //     // check if course duration is exceeded
    //     if (study_yr > student[0].course_duration) {
    //       throw new GraphQLError(
    //         `Student can't exceeded the course duration of ${student[0].course_duration} years.`
    //       );
    //     }

    //     // Get the active/running semester
    //     const all_sems = await getRunningSemesters({
    //       intake_id: student[0].intake_id,
    //     });

    //     const active_sem = all_sems[0]; // the first item in the list

    //     if (!active_sem)
    //       throw new GraphQLError(
    //         `No active semester at this moment, Please try again next time...`
    //       );

    //     // get student enrollment history
    //     const student_enrollment_history = await getStudentEnrollment({
    //       std_id: student_id,
    //       std_no: student_no,
    //     });

    //     let dead_sem_id = "6";
    //     const enrollmentHistWithoutDeadSemesters =
    //       student_enrollment_history.filter(
    //         (enrollment) => enrollment.enrollment_status_id !== dead_sem_id
    //       );

    //     let expectedSemesters;
    //     let activeSem = null;

    //     const studentHasDeadSemInHist = student_enrollment_history.find(
    //       (enrollment) => enrollment.enrollment_status_id == dead_sem_id
    //     );

    //     // console.log(
    //     //   "enrollmentHistWithoutDeadSemesters",
    //     //   enrollmentHistWithoutDeadSemesters
    //     // );

    //     if (studentHasDeadSemInHist) {
    //       activeSem = {
    //         ...active_sem,
    //         semester:
    //           enrollmentHistWithoutDeadSemesters.length > 0
    //             ? enrollmentHistWithoutDeadSemesters[0].next_sem
    //             : 1,
    //       };

    //       expectedSemesters = generateSemesterList(
    //         active_sem.acc_yr_title,
    //         student[0].course_duration,
    //         enrollmentHistWithoutDeadSemesters[0].study_yr,
    //         enrollmentHistWithoutDeadSemesters[0].next_sem,
    //         enrollmentHistWithoutDeadSemesters[0].datetime
    //       );
    //     } else {
    //       expectedSemesters = generateSemesterListForNormalProgress(
    //         student[0].entry_acc_yr_title,
    //         student[0].course_duration
    //       );
    //       activeSem = active_sem;
    //     }

    //     // console.log("active sem", activeSem);
    //     const { deadSemesters, nextEnrollment } = findDeadSemesters(
    //       enrollmentHistWithoutDeadSemesters,
    //       expectedSemesters,
    //       activeSem
    //     );

    //     // console.log("active sem:", activeSem);
    //     // console.log("Expected Sems:", expectedSemesters);
    //     // console.log("Dead Semesters Up To Next Enrollment:", deadSemesters);
    //     // console.log("Next Enrollment:", nextEnrollment);

    //     // check if the student has already enrolled in the current sem
    //     // let existingEnrollment = enrollmentHistWithoutDeadSemesters.find(
    //     //   (hist) => hist.study_yr == study_yr && hist.sem == activeSem.semester
    //     // );

    //     // if (existingEnrollment) {
    //     //   throw new GraphQLError(
    //     //     `Student already enrolled in Year ${study_yr}, Semester ${active_sem.semester}`
    //     //   );
    //     // }

    //     // // ---invoicing---
    //     // const tuition_invoice_no = await generateInvoiceNo({
    //     //   student_no,
    //     //   invoice_category: "TUITION", // invoice_category
    //     // });

    //     // const functional_invoice_no = await generateInvoiceNo({
    //     //   student_no,
    //     //   invoice_category: "FUNCTIONAL", // invoice_category
    //     // });

    //     // // tuition invoice generation
    //     // await createTuitionInvoice({
    //     //   student_details: student,
    //     //   student_no,
    //     //   academic_year: activeSem.acc_yr_id,
    //     //   study_year: study_yr,
    //     //   semester:
    //     //     deadSemesters.length > 0
    //     //       ? nextEnrollment.semester
    //     //       : activeSem.semester,
    //     //   invoice_category: "TUITION",
    //     //   invoice_type: "MANDATORY",
    //     //   tuition_invoice_no,
    //     // });

    //     // // functional fees invoice generation
    //     // await createFunctionalInvoice({
    //     //   student_details: student,
    //     //   student_no,
    //     //   academic_year: activeSem.acc_yr_id,
    //     //   study_year: study_yr,
    //     //   semester:
    //     //     deadSemesters.length > 0
    //     //       ? nextEnrollment.semester
    //     //       : activeSem.semester,
    //     //   invoice_category: "FUNCTIONAL",
    //     //   invoice_type: "MANDATORY",
    //     //   functional_invoice_no,
    //     // });

    //     // const data = {
    //     //   enrollment_token: generateToken(),
    //     //   stdno: student_no,
    //     //   std_id: student_id,
    //     //   // acc_yr: acc_yrs[0].id,
    //     //   acc_yr: activeSem.acc_yr_id,
    //     //   // study_yr: nextEnrollment.studyYear,
    //     //   study_yr: study_yr,
    //     //   sem:
    //     //     deadSemesters.length > 0
    //     //       ? nextEnrollment.semester
    //     //       : activeSem.semester,
    //     //   enrollment_status_id: enrollment_status,
    //     //   datetime: new Date(),
    //     //   enrolled_by,
    //     //   active_sem_id: active_sem.id,
    //     //   next_sem: nextEnrollment.semester == 1 ? 2 : 1,
    //     //   tuition_invoice_no: tuition_invoice_no,
    //     //   functional_invoice_no: functional_invoice_no,
    //     //   invoiced: 1, // will get back to this
    //     // };

    //     // await saveData({
    //     //   table: "students_enrollment",
    //     //   id: null,
    //     //   data: data,
    //     // });

    //     // // lets first check if the dead sem is already posted
    //     // if (deadSemesters.length > 0) {
    //     //   for (const dead_sem of deadSemesters) {
    //     //     const _acc_yrs = await getAccYrs({
    //     //       title: dead_sem.accYear,
    //     //     });

    //     //     // dead semester invoice generation
    //     //     const result = await createDeadSemInvoice({
    //     //       student_details: student,
    //     //       academic_year: _acc_yrs[0].id,
    //     //       student_no,
    //     //       study_year: study_yr,
    //     //       semester: dead_sem.semester,
    //     //       invoice_category: "DEAD SEMESTER",
    //     //       invoice_type: "mandatory",
    //     //     });

    //     //     const deadSemData = {
    //     //       enrollment_token: generateDeadSemToken(),
    //     //       stdno: student_no,
    //     //       std_id: student_id,
    //     //       acc_yr: _acc_yrs[0].id,
    //     //       study_yr: dead_sem.studyYear,
    //     //       sem: dead_sem.semester,
    //     //       enrollment_status_id: dead_sem_id, // dead sem
    //     //       datetime: new Date(),
    //     //       enrolled_by: "SYSTEM",
    //     //       active_sem_id: active_sem.id,
    //     //       next_sem: nextEnrollment.semester == 1 ? 2 : 1,
    //     //       invoiced: 0, // will get back to this
    //     //     };

    //     //     let exists = student_enrollment_history.find(
    //     //       (hist) =>
    //     //         hist.study_yr == dead_sem.studyYear &&
    //     //         hist.sem == dead_sem.semester &&
    //     //         hist.enrollment_status_id == dead_sem_id
    //     //     );

    //     //     if (!exists) {
    //     //       // lets add that to the student's enrollment track
    //     //       await saveData({
    //     //         table: "students_enrollment",
    //     //         id: null,
    //     //         data: deadSemData,
    //     //       });
    //     //     }
    //     //   }
    //     // }

    //     // await connection.commit();

    //     // return {
    //     //   success: "true",
    //     //   message: "Student Enrolled Successfully",
    //     // };
    //   } catch (error) {
    //     await connection.rollback();
    //     throw new GraphQLError(error.message);
    //   } finally {
    //     if (connection) {
    //       await connection.release();
    //     }
    //   }
    // },
    enrollStudent: async (parent, args, context) => {
      try {
        const user_id = context.req.user.id;
        const { student_no, study_yr, semester, enrollment_status } = args;

        const connection = await db.getConnection();
        await connection.beginTransaction();
        let data = null;
        let studentRegistered = true;
        const enrollmentToken = generateEnrollmentToken();

        const [student_details] = await getStudents({
          std_no: student_no,
          get_course_details: true,
        });

        if (!student_details) {
          throw new GraphQLError(`Student with ${student_no} not found!`);
        }

        const [running_semesters] = await getRunningSemesters({
          intake_id: student_details.intake_id,
        });

        // check if student has already enrolled in that study year and sem
        const [isEnrolled] = await getStudentEnrollment({
          std_no: student_no,
          study_yr,
          sem: semester,
          active: true,
          exclude_dead_semesters: true,
        });

        if (isEnrolled) {
          // check if student registered for that enrolled sem
          const [registered] = await getStudentRegistrationHistory({
            enrollment_token: isEnrolled.enrollment_token,
          });

          studentRegistered = false;
          // for the system admin, will be able to activate a new enrollment record for the student since the student didnt registerd in the current one
          // no new invoices should be created since there are already invoices from the prev sem
          data = {
            enrollment_token: enrollmentToken,
            stdno: student_no,
            acc_yr: running_semesters.acc_yr_id,
            study_yr,
            sem: semester,
            enrollment_status_id: enrollment_status,
            datetime: new Date(),
            enrolled_by_type: "staff",
            enrolled_by: user_id,
            active_sem_id: running_semesters.id,
            invoiced: true,
            exempt_reason: `Reference invoices from ${isEnrolled.enrollment_token}`,
            tuition_invoice_no: isEnrolled.tuition_invoice_no,
            functional_invoice_no: isEnrolled.functional_invoice_no,
            active: true,
          };
        } else {
          const enrollment_status_details = await getEnrollmentTypes({
            id: enrollment_status,
          });

          // if (enrolled) throw new GraphQLError(`You are already enrolled in study yr ${study_yr}, semester: ?`)
          // ---invoicing---
          const tuition_invoice_no = await generateInvoiceNo({
            student_no,
            invoice_category: "TUITION", // invoice_category
          });

          const functional_invoice_no = await generateInvoiceNo({
            student_no,
            invoice_category: "FUNCTIONAL", // invoice_category
          });

          // tuition invoice generation
          await createTuitionInvoice({
            student_details: [{ ...student_details }],
            student_no,
            academic_year: running_semesters.acc_yr_id,
            study_year: study_yr,
            semester: semester,
            invoice_category: "TUITION",
            invoice_type: "MANDATORY",
            tuition_invoice_no,
          });

          // functional fees invoice generation
          await createFunctionalInvoice({
            student_details: [{ ...student_details }],
            student_no,
            academic_year: running_semesters.acc_yr_id,
            study_year: study_yr,
            semester: semester,
            invoice_category: "FUNCTIONAL",
            invoice_type: "MANDATORY",
            functional_invoice_no,
          });

          let is_invoiced =
            enrollment_status_details.exempt_tuition &&
            enrollment_status_details.exempt_functional
              ? false
              : true;

          // // enrollment record
          data = {
            enrollment_token: enrollmentToken,
            stdno: student_no,
            acc_yr: running_semesters.acc_yr_id,
            study_yr,
            sem: semester,
            // true_sem: Int,
            enrollment_status_id: enrollment_status,
            datetime: new Date(),
            enrolled_by_type: "student",
            enrolled_by: student_no,
            active_sem_id: running_semesters.id,
            invoiced: is_invoiced,
            tuition_invoice_no: is_invoiced ? tuition_invoice_no : null,
            functional_invoice_no: is_invoiced ? functional_invoice_no : null,
          };
        }

        const save_id = await saveData({
          table: "students_enrollment",
          data,
        });

        if (!studentRegistered) {
          // deactivate the previous enrollment
          const save_id = await saveData({
            table: "students_enrollment",
            data: {
              active: false,
            },
            id: isEnrolled.id,
          });
        }

        return {
          success: true,
          message: "Student Enrolled Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    activateSemester: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const { id } = args;
      try {
        // lets first check for that record
        const [enrollment] = await getStudentEnrollment({
          id,
        });

        if (!enrollment) {
          throw new GraphQLError("Failed to get enrollment details");
        }

        // now lets use these details to get the active version of this enrollemt
        const [activeEn] = await getStudentEnrollment({
          std_no: enrollment.stdno,
          study_yr: enrollment.study_yr,
          sem: enrollment.sem,
          active: true,
        });

        // console.log("active en", activeEn);

        if (!activeEn) {
          throw new GraphQLError(
            "Failed to get the active enrollment of this enrollment"
          );
        }

        // now lets start by deactivating the active one
        const save_id = await saveData({
          table: "students_enrollment",
          data: {
            active: false,
          },
          id: activeEn.id,
        });

        // now lets now activate the inactive one
        const save_id2 = await saveData({
          table: "students_enrollment",
          data: {
            active: true,
          },
          id: id,
        });

        return {
          success: true,
          message: "Semester activated successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    selfEnrollment: async (parent, args, context) => {
      try {
        const student_no = context.req.user.student_no;
        const { study_yr, sem, enrollment_status } = args;
        let studentRegistered = true;
        let data = null;
        const enrollmentToken = generateEnrollmentToken();

        const [student_details] = await getStudents({
          std_no: student_no,
          get_course_details: true,
        });

        if (!student_details) {
          throw new GraphQLError(`Student with ${student_no} not found!`);
        }

        const [running_semesters] = await getRunningSemesters({
          intake_id: student_details.intake_id,
        });

        // check if student has already enrolled in that study year and sem
        const [isEnrolled] = await getStudentEnrollment({
          std_no: student_no,
          study_yr,
          sem,
          active: true,
        });

        // if (isEnrolled) {
        //   // check if student registered for that enrolled sem
        //   const [registered] = await getStudentRegistrationHistory({
        //     enrollment_token: isEnrolled.enrollment_token,
        //   });

        //   if (!registered) {
        //     throw new GraphQLError(
        //       "Student self enrollment Failed, please reach out to the system admin to aid you in enrollment"
        //     );

        //     // for the system admin, will be able to activate a new enrollment record for the student since the student didnt registerd in the current one
        //   } else {
        //     throw new GraphQLError(
        //       `You are already enrolled in study year: ${study_yr} semester: ${sem}`
        //     );
        //   }
        // }

        if (isEnrolled) {
          // check if student registered for that enrolled sem
          const [registered] = await getStudentRegistrationHistory({
            enrollment_token: isEnrolled.enrollment_token,
          });

          studentRegistered = false;
          // for the system admin, will be able to activate a new enrollment record for the student since the student didnt registerd in the current one
          // no new invoices should be created since there are already invoices from the prev sem
          data = {
            enrollment_token: enrollmentToken,
            stdno: student_no,
            acc_yr: running_semesters.acc_yr_id,
            study_yr,
            sem,
            enrollment_status_id: enrollment_status,
            datetime: new Date(),
            enrolled_by_type: "student",
            enrolled_by: student_no,
            active_sem_id: running_semesters.id,
            invoiced: true,
            exempt_reason: `Reference invoices from ${isEnrolled.enrollment_token}`,
            tuition_invoice_no: isEnrolled.tuition_invoice_no,
            functional_invoice_no: isEnrolled.functional_invoice_no,
            active: true,
          };
        } else {
          const enrollment_status_details = await getEnrollmentTypes({
            id: enrollment_status,
          });

          // if (enrolled) throw new GraphQLError(`You are already enrolled in study yr ${study_yr}, semester: ?`)
          // ---invoicing---
          const tuition_invoice_no = await generateInvoiceNo({
            student_no,
            invoice_category: "TUITION", // invoice_category
          });

          const functional_invoice_no = await generateInvoiceNo({
            student_no,
            invoice_category: "FUNCTIONAL", // invoice_category
          });

          // tuition invoice generation
          await createTuitionInvoice({
            student_details: [{ ...student_details }],
            student_no,
            academic_year: running_semesters.acc_yr_id,
            study_year: study_yr,
            semester: sem,
            invoice_category: "TUITION",
            invoice_type: "MANDATORY",
            tuition_invoice_no,
          });

          // functional fees invoice generation
          await createFunctionalInvoice({
            student_details: [{ ...student_details }],
            student_no,
            academic_year: running_semesters.acc_yr_id,
            study_year: study_yr,
            semester: sem,
            invoice_category: "FUNCTIONAL",
            invoice_type: "MANDATORY",
            functional_invoice_no,
          });

          let is_invoiced =
            enrollment_status_details.exempt_tuition &&
            enrollment_status_details.exempt_functional
              ? false
              : true;

          // enrollment record
          data = {
            enrollment_token: enrollmentToken,
            stdno: student_no,
            acc_yr: running_semesters.acc_yr_id,
            study_yr,
            sem: sem,
            // true_sem: Int,
            enrollment_status_id: enrollment_status,
            datetime: new Date(),
            enrolled_by_type: "student",
            enrolled_by: student_no,
            active_sem_id: running_semesters.id,
            invoiced: is_invoiced,
            tuition_invoice_no: is_invoiced ? tuition_invoice_no : null,
            functional_invoice_no: is_invoiced ? functional_invoice_no : null,
          };

          // console.log("data", data);
        }

        const save_id = await saveData({
          table: "students_enrollment",
          data,
        });

        if (!studentRegistered) {
          // deactivate the previous enrollment
          const save_id = await saveData({
            table: "students_enrollment",
            data: {
              active: false,
            },
            id: isEnrolled.id,
          });
        }

        return {
          success: true,
          message: "Student Enrolled Successfully",
        };
      } catch (error) {
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

export default studentEnrollmentResolvers;
