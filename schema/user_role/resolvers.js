import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

const getAllUserRoles = async () => {
  try {
    let sql = `SELECT r.* FROM user_roles AS r`;

    const [results, fields] = await db.execute(sql);
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
      const result = await getAllUserRoles();
      return result;
    },
    roles: async (parent, args) => {
      const result = await getAllUserRoles();
      return result;
    },
  },
  Mutation: {},
};

export default userRoleResolvers;
