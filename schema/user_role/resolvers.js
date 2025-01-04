import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

export const getUserRoles = async ({ id }) => {
  try {
    let values = [];
    let where = "";

    if (id) {
      where += " AND r.id = ?";
      values.push(id);
    }
    let sql = `SELECT r.* FROM user_roles AS r`;

    const [results] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching modules");
  }
};

const userRoleResolvers = {
  Query: {
    user_roles: async (parent, args) => {
      const result = await getUserRoles({});
      return result;
    },
    roles: async (parent, args) => {
      const result = await getUserRoles({});
      return result;
    },
  },
  Mutation: {},
};

export default userRoleResolvers;
