import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

export const getDistricts = async ({}) => {
  try {
    let where = "";
    let values = [];

    let sql = `SELECT * FROM districts WHERE deleted = 0 ${where} ORDER BY id ASC`;

    const [results] = await db.execute(sql, values);

    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching Districts");
  }
};

const districtResolvers = {
  Query: {
    districts: async () => {
      const result = await getDistricts({});
      return result;
    },
  },
};

export default districtResolvers;
