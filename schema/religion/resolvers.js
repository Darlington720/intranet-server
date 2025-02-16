import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

export const getReligions = async ({}) => {
  try {
    let where = "";
    let values = [];

    let sql = `SELECT * FROM religions WHERE deleted = 0 ${where} ORDER BY id ASC`;

    const [results] = await db.execute(sql, values);

    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching Religions");
  }
};

const religionResolvers = {
  Query: {
    religions: async () => {
      const result = await getReligions({});
      return result;
    },
  },
};

export default religionResolvers;
