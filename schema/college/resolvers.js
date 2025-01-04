import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";

export const getColleges = async ({ id }) => {
  try {
    let values = [];
    let where = "";

    if (id) {
      where += " AND id = ?";
      values.push(id);
    }
    let sql = `SELECT * FROM colleges WHERE deleted = 0 ${where}`;

    const [results] = await db.execute(sql, values);
    return results;
  } catch (error) {
    throw new GraphQLError("Error fetching colleges", error.message);
  }
};

const collegeResolvers = {
  Query: {
    colleges: async () => {
      const results = await getColleges({});
      return results;
    },
  },
  College: {
    schools: async (parent, args) => {
      try {
        let college_id = parent.id;
        let sql = `SELECT * FROM schools WHERE college_id = ? AND deleted = 0 ORDER BY school_code ASC`;
        let values = [college_id];
        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results.length);
        return results; // expecting one or more schools from a single college
      } catch (error) {
        console.log("error", error);
        throw new GraphQLError("Error fetching modules");
      }
    },
  },
  Mutation: {
    saveCollege: async (parent, args) => {
      const unique_id = generateUniqueID();
      const { id, college_code, college_title } = args;

      // console.log("the id", id);

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE colleges SET college_code = ?, college_title = ? WHERE id = ?`;

          let values = [college_code, college_title, id];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No college with id ${id}`, {
              extensions: {
                // code: '',
                http: { status: 400 },
              },
            });
          }
        } catch (error) {
          // console.log("error", error);
          throw new GraphQLError(error, {
            extensions: {
              // code: '',
              http: { status: 400 },
            },
          });
        }
      } else {
        // create new record
        try {
          let sql = `INSERT INTO colleges(id, college_code, college_title) VALUES (?, ?, ?)`;

          let values = [unique_id, college_code, college_title];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert college");
        }
      }

      let sql = `SELECT * FROM colleges`;

      const [results, fields] = await db.execute(sql);

      return results; // returning all colleges
    },
  },
};

export default collegeResolvers;
