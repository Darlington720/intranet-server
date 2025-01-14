import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import resolveSemesterStatus from "../../utilities/resolveSemesterStatus.js";
import softDelete from "../../utilities/db/softDelete.js";

const getAcademicSchedules = async () => {
  try {
    let sql = `SELECT * FROM academic_schedule where deleted = 0 ORDER BY start_date DESC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching Accademic years");
  }
};

export const getRunningSemesters = async ({
  intake_id,
  id,
  acc_yr,
  sem,
  limit,
}) => {
  try {
    let values = [];
    let where = "";

    // console.log("payload", {
    //   intake_id,
    //   id,
    // });

    if (intake_id) {
      where += " AND academic_schedule.intake_id = ?";
      values.push(intake_id);
    }

    if (id) {
      where += " AND academic_schedule.id = ?";
      values.push(id);
    }

    if (acc_yr) {
      where += " AND academic_schedule.acc_yr_id = ?";
      values.push(acc_yr);
    }

    if (sem) {
      where += " AND academic_schedule.semester = ?";
      values.push(sem);
    }

    const pagination = limit !== undefined ? `LIMIT ${limit}` : "";
    // if (pagination) {
    //   values.push(1);
    // }

    let sql = `SELECT academic_schedule.*, acc_yrs.acc_yr_title
      FROM academic_schedule
      LEFT JOIN acc_yrs ON acc_yrs.id = academic_schedule.acc_yr_id   
      WHERE CURRENT_DATE BETWEEN start_date AND end_date AND academic_schedule.deleted = 0 ${where} ORDER BY start_date DESC ${pagination};`;

    const [results, fields] = await db.execute(sql, values);

    // if there is no running sem, lets return the previously operating sem
    if (results.length > 0) {
      return results;
    } else {
      let sql2 = `SELECT academic_schedule.*, acc_yrs.acc_yr_title
      FROM academic_schedule
      LEFT JOIN acc_yrs ON acc_yrs.id = academic_schedule.acc_yr_id   
      WHERE academic_schedule.deleted = 0 ${where} ORDER BY start_date DESC, id DESC LIMIT 1;`;

      const [results2, fields2] = await db.execute(sql2, values);

      // console.log("results", results2);

      return results2;
    }
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching running semesters " + error.message);
  }
};

const AcademicScheduleResolvers = {
  Query: {
    academic_schedules: async () => {
      const result = await getAcademicSchedules();

      const schedules = resolveSemesterStatus(result);
      // console.log("result", result);
      return schedules;
    },
  },
  AcademicSchedule: {
    acc_yr: async (parent, args) => {
      try {
        const acc_yr_id = parent.acc_yr_id;
        let sql = `SELECT * FROM acc_yrs WHERE id = ?`;

        let values = [acc_yr_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(
          "Error fetching accademic year " + error.message
        );
      }
    },
    intake: async (parent, args) => {
      try {
        const intake_id = parent.intake_id;
        let sql = `SELECT * FROM intakes WHERE id = ?`;

        let values = [intake_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching intake " + error.message);
      }
    },
    added_user: async (parent, args) => {
      try {
        const user_id = parent.added_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    modified_user: async (parent, args) => {
      try {
        const user_id = parent.modified_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
  },
  Mutation: {
    saveAcademicSchedule: async (parent, args) => {
      try {
        const {
          id,
          acc_yr_id,
          intake_id,
          semester,
          start_date,
          end_date,
          added_by,
        } = args;

        // Regular expression to match YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        // Validate if date matches the required format
        const isValidDateFormat = (dateString) => {
          return dateRegex.test(dateString);
        };

        // Ensure start_date and end_date match the format
        if (!isValidDateFormat(start_date)) {
          throw new Error(
            "Invalid start date format. Please use 'YYYY-MM-DD'."
          );
        }

        if (!isValidDateFormat(end_date)) {
          throw new Error("Invalid end date format. Please use 'YYYY-MM-DD'.");
        }

        const today = new Date();
        const start = new Date(start_date);
        const end = new Date(end_date);

        // Additional check: Ensure parsed dates are valid
        if (isNaN(start.getTime())) {
          throw new Error("Invalid start date.");
        }
        if (isNaN(end.getTime())) {
          throw new Error("Invalid end date.");
        }

        let data = null;

        if (id) {
          data = {
            acc_yr_id,
            intake_id,
            semester,
            start_date: start,
            end_date: end,
            modified_by: added_by,
            modified_on: today,
          };
        } else {
          data = {
            acc_yr_id,
            intake_id,
            semester,
            start_date: start,
            end_date: end,
            added_by,
            added_on: today,
          };
        }

        await saveData({
          table: "academic_schedule",
          id,
          data,
        });

        return {
          success: "true",
          message: "Schedule saved successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    deleteAdcademicSchedule: async (parent, args) => {
      try {
        const { schedule_id } = args;

        await softDelete({
          table: "academic_schedule",
          id: schedule_id,
        });

        return {
          success: "true",
          message: "Schedule deleted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default AcademicScheduleResolvers;
