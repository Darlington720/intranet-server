import { tredumoDB, db } from "../../config/config.js";

const staffResolvers = {
  Query: {
    staff_members: async () => {
      const results = await tredumoDB("staff");
      // console.log("roles", results);
      return results;
    },
  },
};

export default staffResolvers;
