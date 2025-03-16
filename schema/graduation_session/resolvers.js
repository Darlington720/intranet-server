import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";

export const getGraduationSessions = async ({ active }) => {
  try {
    let values = [];
    let where = "";
    if (active) {
      where += " AND graduation_sessions.graduation_date >= CURDATE()";
    }

    let sql = `
    SELECT 
    graduation_sessions.*,
    acc_yrs.acc_yr_title,
    CASE 
        WHEN graduation_sessions.graduation_date < CURDATE() THEN 'completed'
        ELSE 'running'
    END AS status
      FROM graduation_sessions 
      LEFT JOIN acc_yrs ON acc_yrs.id = graduation_sessions.acc_yr_id
      WHERE graduation_sessions.deleted = 0 ${where}
      ORDER BY last_modified_by DESC;
    `;

    const [results] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching graduation sessions");
  }
};

const graduationSessionResolvers = {
  Query: {
    graduation_sessions: async () => {
      const result = await getGraduationSessions({});
      return result;
    },
    active_graduation_session: async () => {
      const [result] = await getGraduationSessions({
        active: true,
      });
      return result;
    },
  },

  Mutation: {
    saveGraduationSession: async (parent, args, context) => {
      const user_id = context.req.user.id;
      const {
        id,
        acc_yr_id,
        graduation_date,
        clearance_start_date,
        clearance_deadline,
        graduation_venue,
        maximum_attendees,
      } = args.payload;

      try {
        const data = {
          acc_yr_id,
          graduation_date: new Date(graduation_date),
          clearance_start_date: new Date(clearance_start_date),
          clearance_deadline: new Date(clearance_deadline),
          graduation_venue,
          maximum_attendees,
          last_modified_on: new Date(),
          last_modified_by: user_id,
        };

        // console.log("data", data);
        await saveData({
          table: "graduation_sessions",
          data,
          id,
        });

        return {
          success: true,
          message: "Graduation sesssion created successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default graduationSessionResolvers;
