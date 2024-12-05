import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import DataLoader from "dataloader";

// Create a DataLoader for courses
const courseLoader = new DataLoader(async (departmentIds) => {
  // Execute a single query for all department IDs
  // console.log("department ids", departmentIds);
  const [courses] = await db.execute(
    `
    SELECT 
      courses.id,
      course_code,
      course_title,
      course_duration,
      department_id,
      college_id
    FROM courses 
    WHERE department_id IN (${departmentIds.map(() => "?").join(",")}) 
    AND deleted = 0 
    ORDER BY course_code ASC
  `,
    departmentIds
  );

  // Group courses by department_id
  const coursesByDepartment = departmentIds.map((id) =>
    courses.filter((course) => course.department_id === id)
  );

  // console.log("courses", coursesByDepartment);

  return coursesByDepartment;
});

const getAllDepartments = async () => {
  try {
    let sql = `SELECT * FROM departments WHERE deleted = 0`;

    const [results, fields] = await db.execute(sql);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching departments", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const departmentResolvers = {
  Query: {
    departments: async () => {
      const result = await getAllDepartments();
      return result;
    },
    departments_in_school: async (parent, args) => {
      try {
        const { school_id } = args;
        let sql = `SELECT * FROM departments WHERE school_id = ? AND deleted = 0 ORDER BY dpt_code ASC`;
        let values = [school_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results; // return schools in college
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching departments in school", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
  },
  Department: {
    school: async (parent, args) => {
      try {
        const school_id = parent.school_id;
        let sql = `SELECT * FROM schools WHERE id = ? AND deleted = 0`;

        let values = [school_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0]; // expecting one school based on  school_id
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError("Error fetching school", {
          extensions: {
            code: "UNAUTHENTICATED",
            http: { status: 501 },
          },
        });
      }
    },
    // courses: async (parent, args) => {
    //   try {
    //     let where = "";
    //     const dpt_id = parent.id;
    //     let values = [dpt_id];

    //     if (args.campus_id) {
    //       where += ` AND JSON_CONTAINS(
    //         campuses,
    //         JSON_OBJECT(
    //           'value', ?
    //         ),
    //         '$'
    //       )`;
    //       values.push(args.campus_id);
    //     }
    //     let sql = `SELECT * FROM courses WHERE department_id = ? AND deleted = 0 ${where} ORDER BY course_code ASC`;

    //     const [results, fields] = await db.execute(sql, values);
    //     // console.log("results", results);
    //     return results; // expecting many courses
    //   } catch (error) {
    //     // console.log("error", error);
    //     throw new GraphQLError("Error fetching courses", {
    //       extensions: {
    //         code: "UNAUTHENTICATED",
    //         http: { status: 501 },
    //       },
    //     });
    //   }
    // },
    courses: (parent) => courseLoader.load(parent.id),
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
    department_head: async (parent, args) => {
      try {
        const user_id = parent.dpt_head_id;
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
  },
  Mutation: {
    saveDepartment: async (parent, args) => {
      const { id, dpt_code, dpt_title, dpt_head_id, school_id, added_by } =
        args;
      const uniqueID = generateUniqueID();
      // we need the current date
      const today = new Date();

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE departments SET dpt_code = ?, dpt_title = ?, dpt_head_id = ?, school_id = ?, modified_by = ?, modified_on = ? WHERE id = ?`;

          let values = [
            dpt_code,
            dpt_title,
            dpt_head_id,
            school_id,
            added_by,
            today,
            id,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No department with id ${id}`, {
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
          let sql = `INSERT INTO departments(id, dpt_code, dpt_title, dpt_head_id, school_id, added_by, added_on) VALUES (?, ?, ?, ?, ?, ?, ?)`;

          let values = [
            uniqueID,
            dpt_code,
            dpt_title,
            dpt_head_id,
            school_id,
            added_by,
            today,
          ];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert department");
        }
      }

      const result = await getAllDepartments();
      // console.log("the schools", results);

      return result; // returning all schools
    },
    deleteDepartment: async (parent, args) => {
      try {
        const { dpt_id } = args;

        let sql = `UPDATE departments SET deleted = 1 WHERE id = ?`;

        let values = [dpt_id];

        const [results, fields] = await db.execute(sql, values);

        // console.log("the results", results);
        if (results.affectedRows == 0 || results.changedRows == 0) {
          // no record the provided id
          throw new GraphQLError(`No department with id ${dpt_id}`, {
            extensions: {
              // code: '',
              http: { status: 400 },
            },
          });
        }

        const result = await getAllDepartments();
        return result;
      } catch (error) {
        throw new GraphQLError(error);
      }
    },
  },
};

export default departmentResolvers;
