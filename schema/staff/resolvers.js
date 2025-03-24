import { db } from "../../config/config.js";
import { getEmployees } from "../employee/resolvers.js";

const staffResolvers = {
  Query: {
    staff_members: async (parent, args) => {
      const result = await getEmployees({
        active: args.active,
      });
      return result;
    },
  },
};

export default staffResolvers;
