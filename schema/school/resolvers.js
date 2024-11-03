import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import saveData from "../../utilities/db/saveData.js";
import { getAllCourses } from "../course/resolvers.js";

const getSchools = async ({ college_id }) => {
  try {
    let where = "";
    let values = [];

    if (college_id) {
      where += " AND college_id = ?";
      values.push(college_id);
    }

    let sql = `SELECT * FROM schools WHERE deleted = 0 ${where} ORDER BY school_code ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching schools", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const schoolResolvers = {
  Query: {
    schools: async () => {
      const result = await getSchools({});
      // console.log(result);
      return result;
    },
    schools_in_college: async (parent, args) => {
      try {
        const { college_id } = args;
        // let sql = `SELECT * FROM schools WHERE college_id = ? AND deleted = 0 ORDER BY school_code ASC`;
        // let values = [college_id];
        const results = await getSchools({
          college_id,
        });

        // const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // return schools in college
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching colleges", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
  },
  School: {
    college: async (parent, args) => {
      try {
        const college_id = parent.college_id;
        let sql = `SELECT * FROM colleges WHERE id = ?`;

        let values = [college_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting one college based on id
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching college", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    added_user: async (parent, args) => {
      try {
        const user_id = parent.added_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    modified_user: async (parent, args) => {
      try {
        const user_id = parent.modified_by;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    school_dean: async (parent, args) => {
      try {
        const user_id = parent.school_dean_id;
        let sql = `SELECT * FROM staff WHERE id = ?`;

        let values = [user_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting the one who added the user
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching user", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    departments: async (parent, args) => {
      const school_id = parent.id;

      try {
        let sql = `SELECT * FROM departments WHERE school_id = ? AND deleted = 0 `;

        let values = [school_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting the departments in particular school
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching departments", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    levels: async (parent, args) => {
      const level_ids = parent.school_levels;
      let levelIdsArray = [];
      let placeholders = null;
      try {
        if (level_ids) {
          // Split the string into an array of individual IDs
          levelIdsArray = level_ids.split(",");

          // Dynamically generate placeholders based on the array length
          placeholders = levelIdsArray.map(() => "?").join(",");
        }

        // Build the SQL query with placeholders
        let sql = `SELECT *
        FROM levels
        WHERE id IN (${placeholders});`;

        // Execute the query with the array of values
        const [results, fields] = await db.execute(sql, levelIdsArray);
        // console.log("results", results);
        return results;
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
    courses: async (parent, args) => {
      try {
        let where = "";
        const school_id = parent.id;
        let values = [school_id];

        if (args.campus_id) {
          where += ` AND JSON_CONTAINS(
            campuses,
            JSON_OBJECT(
              'value', ?
            ),
            '$'
          )`;
          values.push(args.campus_id);
        }
        let sql = `SELECT * FROM courses WHERE school_id = ? AND deleted = 0 ${where} ORDER BY course_code ASC`;

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // expecting many courses
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching courses", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
  },
  Mutation: {
    saveSchool: async (parent, args) => {
      const {
        id,
        school_code,
        school_title,
        school_dean_id,
        college_id,
        added_by,
      } = args;
      // we need the current date
      const today = new Date();
      const uniqueID = generateUniqueID();
      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE schools SET school_code = ?, school_title = ?, school_dean_id = ?, college_id = ?, modified_by = ?, modified_on = ? WHERE id = ?`;

          let values = [
            school_code,
            school_title,
            school_dean_id,
            college_id,
            added_by,
            today,
            id,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No school with id ${id}`, {
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
          let sql = `INSERT INTO schools(id, school_code, school_title, school_dean_id, college_id, added_by, added_on) VALUES (?, ?, ?, ?, ?, ?, ?)`;

          let values = [
            uniqueID,
            school_code,
            school_title,
            school_dean_id,
            college_id,
            added_by,
            today,
          ];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert college");
        }
      }

      const result = await getAllSchools();
      // console.log("the schools", results);

      return result; // returning all schools
    },
    deleteSchool: async (parent, args) => {
      try {
        const { school_id } = args;

        let sql = `UPDATE schools SET deleted = 1 WHERE id = ?`;

        let values = [school_id];

        const [results, fields] = await db.execute(sql, values);

        // console.log("the results", results);
        if (results.affectedRows == 0 || results.changedRows == 0) {
          // no record the provided id
          throw new GraphQLError(`No school with id ${school_id}`, {
            extensions: {
              // code: '',
              http: { status: 400 },
            },
          });
        }

        const result = await getAllSchools();
        return result;
      } catch (error) {
        throw new GraphQLError(error);
      }
    },
    saveSchoolLevels: async (parent, args) => {
      const { school_id, levels, added_by } = args;

      try {
        let idsString = "";
        // stringify the levels
        if (levels) {
          idsString = levels.join(",");
        }
        const data = {
          school_levels: idsString,
          modified_by: added_by,
          modified_on: new Date(),
        };

        const result = await saveData({
          table: "schools",
          data,
          id: school_id,
        });

        if (result == 0) {
          throw new GraphQLError(`No data with id ${school_id} found`);
        }

        return {
          success: "true",
          message: "Levels saved successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default schoolResolvers;
