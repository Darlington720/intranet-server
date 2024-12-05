import { GraphQLError } from "graphql";
import { tredumoDB, db, baseUrl } from "../../config/config.js";
import { gettModulePermissions } from "../module_permission/resolvers.js";

export const gettModules = async ({ id }) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where = " AND id = ?";
      values.push(id);
    }

    let sql = `SELECT * FROM intranent_modules WHERE deleted = 0 ${where} ORDER BY sort ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);

    let updatedModules = [];

    for (const item of results) {
      const logo = item.logo;
      const newItem = { ...item }; // Create a copy of the current item

      if (logo) {
        newItem.logo = `${baseUrl}${logo}`; // Update the logo property with the full URL
      }

      updatedModules.push(newItem);
    }

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
    permissions: async (parent) => {
      const permissions = await gettModulePermissions({
        module_id: parent.id,
      });

      return permissions;
    },
  },
};

export default moduleResolvers;
