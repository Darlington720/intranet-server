import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

const getAllFrequencyCodes = async () => {
  try {
    let sql = `SELECT * FROM frequency_codes`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching frequency codes");
  }
};

const frequencyCodeResolvers = {
  Query: {
    frequency_codes: async () => {
      const result = await getAllFrequencyCodes();
      return result;
    },
  },
};

export default frequencyCodeResolvers;
