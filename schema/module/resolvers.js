import { tredumoDB, db, baseUrl } from "../../config/config.js";

const moduleResolvers = {
  Query: {
    modules: async () => {
      try {
        let sql = `SELECT * FROM intranent_modules ORDER BY sort ASC`;

        const [results, fields] = await db.execute(sql);
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
    },
  },
  Mutation: {},
};

export default moduleResolvers;
