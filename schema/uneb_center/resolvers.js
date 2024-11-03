import { GraphQLError } from "graphql";
import { tredumoDB, db } from "../../config/config.js";

export const getUnebCentres = async ({ id } = {}) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where += " AND uneb_centres.id = ?";
      values.push(id);
    }

    let sql = `SELECT * FROM uneb_centres WHERE deleted = 0 ${where} ORDER BY center_name ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching uneb centers " + error.message, {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const unebCentreResolvers = {
  Query: {
    uneb_centres: async () => {
      try {
        const centres = await getUnebCentres();
        // console.log("centers", centres);
        return centres;
      } catch (error) {
        console.log(error);
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default unebCentreResolvers;
