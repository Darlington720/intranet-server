import { GraphQLError } from "graphql";
import { tredumoDB, db } from "../../config/config.js";

export const getUnebStudyLevels = async ({ id }) => {
  try {
    let where = "";
    let values = [];

    if (id) {
      where += " AND uneb_study_levels.id = ?";
      values.push(id);
    }

    let sql = `SELECT * FROM uneb_study_levels WHERE deleted = 0 ${where} ORDER BY title ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError(
      "Error fetching uneb study levels " + error.message,
      {
        extensions: {
          code: "UNAUTHENTICATED",
          http: { status: 501 },
        },
      }
    );
  }
};

const unebStudyLevelResolvers = {
  Query: {
    uneb_study_levels: async () => {
      const study_levels = await getUnebStudyLevels();
      return study_levels;
    },
  },
};

export default unebStudyLevelResolvers;
