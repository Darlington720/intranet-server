import { GraphQLError } from "graphql";
import { tredumoDB, db } from "../../config/config.js";
import { getUnebStudyLevels } from "../uneb_study_levels/resolvers.js";

export const getUnebSubjects = async ({
  uneb_study_level_id,
  uneb_subject_code,
}) => {
  try {
    let where = "";
    let values = [];
    if (uneb_study_level_id) {
      where += " AND uneb_subjects.uneb_study_level_id = ?";
      values.push(uneb_study_level_id);
    }

    if (uneb_subject_code) {
      where += " AND uneb_subjects.uneb_subject_code = ?";
      values.push(uneb_subject_code);
    }

    let sql = `SELECT * FROM uneb_subjects WHERE deleted = 0 ${where} ORDER BY uneb_subject_title ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching uneb subjects " + error.message, {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const unebSubjectResolvers = {
  Query: {
    uneb_Subjects: async (parent, args) => {
      const subjects = await getUnebSubjects({
        uneb_study_level_id: args.uneb_study_level_id,
      });
      return subjects;
    },
  },
  UnebSubject: {
    uneb_study_level: async (parent, args) => {
      try {
        let level = await getUnebStudyLevels({
          id: parent.uneb_study_level_id,
        });

        return level[0];
      } catch (error) {
        throw new GraphQLError(
          "Error fetching uneb subjects " + error.message,
          {
            extensions: {
              code: "BADREQUEST",
              http: { status: 400 },
            },
          }
        );
      }
    },
  },
};

export default unebSubjectResolvers;
