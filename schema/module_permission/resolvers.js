import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import { gettModules } from "../module/resolvers.js";

export const gettModulePermissions = async ({ module_id }) => {
  try {
    let where = "";
    let values = [];

    if (module_id) {
      where += " AND module_id = ?";
      values.push(module_id);
    }

    let sql = `
      SELECT 
      * 
      FROM module_permissions
      WHERE deleted = 0 ${where}
      `;

    const [results] = await db.execute(sql, values);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching roles");
  }
};

const modulePermissionRessolvers = {
  Query: {
    module_permissions: async (parent, args) => {
      const result = await gettModulePermissions({
        module_id: args.module_id,
      });
      return result;
    },
  },
  ModulePermission: {
    module: async (parent) => {
      const result = await gettModules({ id: parent.module_id });
      return result[0];
    },
  },
};

export default modulePermissionRessolvers;
