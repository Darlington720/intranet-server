import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";
import { gettModules } from "../module/resolvers.js";

export const getRoles = async ({ id }) => {
  try {
    let values = [];
    let where = "";

    if (id || id === 0) {
      where += " AND r.role_id = ?";
      values.push(id);
    }
    let sql = `SELECT r.* FROM roles AS r WHERE deleted = 0 ${where} ORDER BY r.role_id DESC`;

    const [results] = await db.execute(sql, values);

    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching roles");
  }
};

const roleResolvers = {
  Query: {
    all_roles: async (parent, args) => {
      const result = await getRoles({});
      return result;
    },
    role_modules: async (parent, args) => {
      const results = gettModules({
        role_id: args.role_id,
      });
      return results;
    },
  },
  Role: {
    _modules: (parent) => {
      const results = gettModules({
        role_id: parent.role_id,
      });
      return results;
    },
  },
  Mutation: {
    saveRole: async (parent, args, context) => {
      try {
        const { id, role_name, description } = args.payload;

        const data = {
          role_name,
          description,
        };

        const save_id = await saveData({
          table: "roles",
          data,
          id,
          idColumn: "role_id",
        });

        return {
          success: "true",
          message: id
            ? "Role updated successfully"
            : "Role Created Successfully",
        };
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError("Duplicate Role");
      }
    },
    deleteRole: async (parent, args, context) => {
      try {
        const { role_id } = args;

        // await softDelete({
        //   table: "roles",
        //   id: role_id,
        //   idColumn: "role_id",
        // });

        // delete the role
        let sql = "DELETE FROM roles WHERE role_id = ?";
        let values = [role_id];

        await db.execute(sql, values);

        return {
          success: "true",
          message: "Role deleted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    updateRoleModules: async (parent, args, context) => {
      try {
        const { role_id, module_ids } = args.payload;

        const data = module_ids.map((id) => ({
          role_id,
          module_id: id,
        }));

        const table = "role_modules";

        let columns = Object.keys(data[0]); // Columns from the first object in the array
        let placeholders = columns.map(() => "?").join(", ");
        let sql = `INSERT IGNORE INTO ${table} (${columns.join(
          ", "
        )}) VALUES (${placeholders})`;

        const promises = data.map((row) => {
          let values = Object.values(row);
          return db.execute(sql, values);
        });

        const results = await Promise.all(promises);

        return {
          success: "true",
          message: "Modules Added Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    deleteRoleModule: async (parent, args, context) => {
      try {
        const { role_id, module_id } = args;

        let sql =
          "DELETE FROM role_modules WHERE role_id = ? AND module_id = ?";
        let values = [role_id, module_id];

        const [results] = await db.execute(sql, values);

        if (results.affectedRows == 0) {
          throw new GraphQLError("Failed to get Module!");
        }

        return {
          success: "true",
          message: "Modules Removed Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
    updateRolePermissions: async (parent, args, context) => {
      try {
        const { role_id, permissions } = args.payload;

        const data = {
          permissions: JSON.stringify(permissions),
        };

        const save_id = await saveData({
          table: "roles",
          data,
          id: role_id,
          idColumn: "role_id",
        });

        return {
          success: "true",
          message: "Permissions Saved Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default roleResolvers;
