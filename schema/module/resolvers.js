import { GraphQLError } from "graphql";
import { tredumoDB, db, baseUrl } from "../../config/config.js";
import { gettModulePermissions } from "../module_permission/resolvers.js";

export const gettModules = async ({ id, role_id }) => {
  try {
    let where = "";
    let values = [];
    let extra_join = "";

    if (id) {
      where = " AND id = ?";
      values.push(id);
    }

    if (role_id) {
      where += " AND role_modules.role_id = ?";
      extra_join +=
        " INNER JOIN role_modules ON role_modules.module_id = intranent_modules.id";
      values.push(role_id);
    }

    let sql = `SELECT 
      intranent_modules.* 
      FROM intranent_modules
      ${extra_join} 
      WHERE deleted = 0 ${where} ORDER BY sort ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);

    const updatedModules = results.map((item) => {
      return {
        ...item,
        logo: item.logo ? `${baseUrl}${item.logo}` : null,
      };
    });

    // console.log("updatedModules", updatedModules);

    return updatedModules;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching modules");
  }
};

const moduleResolvers = {
  Query: {
    modules: async () => {
      const modules = await gettModules({});

      return modules;
    },
  },
  Module: {
    // permissions: async (parent) => {
    //   const permissions = await gettModulePermissions({
    //     module_id: parent.id,
    //   });
    //   return permissions;
    // },
  },
};

export default moduleResolvers;
