import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";

const getAllSemesters = async () => {
  try {
    let sql = `SELECT * FROM semesters ORDER BY id ASC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching semesters " + error.message);
  }
};

const SemesterResolvers = {
  Query: {
    semesters: async () => {
      const result = await getAllSemesters();
      return result;
    },
  },
};

export default SemesterResolvers;
