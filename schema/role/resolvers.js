import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";

const getAllRoles = async () => {
  try {
    let sql = `SELECT * FROM roles WHERE deleted = 0`;
    const [results] = await db.execute(sql);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching roles");
  }
};

const roleResolvers = {
  Query: {
    all_roles: async (parent, args) => {
      const result = await getAllRoles();
      return result;
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

        await softDelete({
          table: "roles",
          id: role_id,
          idColumn: "role_id",
        });

        return {
          success: "true",
          message: "Role deleted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default roleResolvers;
