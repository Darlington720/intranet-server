import { GraphQLError } from "graphql";
import { tredumoDB, db, database } from "../../config/config.js";
import saveData from "../../utilities/db/saveData.js";
import softDelete from "../../utilities/db/softDelete.js";

const getDesignations = async () => {
  try {
    let sql = `SELECT * FROM designations WHERE deleted = 0 ORDER BY id DESC`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching designations");
  }
};

const designationResolvers = {
  Query: {
    designations: async () => {
      const result = await getDesignations();
      return result;
    },
  },
  Mutation: {
    saveDesignation: async (parent, args) => {
      const { id, name, description } = args.payload;
      // we need the current date
      const today = new Date();

      const data = {
        designation_name: name,
        description: description,
        created_on: today,
      };

      await saveData({
        table: "designations",
        data,
        id,
      });

      return {
        success: "true",
        message: "Desigantion created successfully",
      };
    },
    deleteDesignation: async (parent, args) => {
      try {
        const { id } = args;

        await softDelete({
          table: "designations",
          id,
        });
        return {
          success: "true",
          message: "Designation deleted successfully",
        };
      } catch (error) {
        throw new GraphQLError(error);
      }
    },
  },
};

export default designationResolvers;
