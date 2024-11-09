import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

export const getAllGrading = async ({ id, grading_title }) => {
  try {
    let values = [];
    let where = "";

    if (id) {
      where += " AND grading_systems.id = ?";
      values.push(id);
    }

    if (grading_title) {
      where += " AND grading_systems.grading_title = ?";
      values.push(grading_title);
    }
    let sql = `SELECT * FROM grading_systems WHERE deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error.message);
    throw new GraphQLError("Error fetching grading systems " + error.message);
  }
};

const getGradingDetails = async (grading_id) => {
  try {
    let sql = `SELECT * FROM grading_system_details WHERE grading_system_id = ? AND deleted = 0 ORDER BY min_value DESC`;
    let values = [grading_id];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching grading details", {
      extensions: {
        code: "UNAUTHENTICATED",
        http: { status: 501 },
      },
    });
  }
};

const gradingResolvers = {
  Query: {
    grading: async () => {
      const result = await getAllGrading({});
      return result;
    },
    grading_details: async (parent, args) => {
      const result = await getGradingDetails(args.grading_id);
      return result;
    },
  },
  Grading: {
    grading_details: async (parent, args) => {
      let grading_id = parent.id;
      const result = await getGradingDetails(grading_id);
      return result;
    },
  },
  GradingDetails: {
    grading: async (parent, args) => {
      let grading_id = parent.grading_id;
      try {
        let sql = `SELECT * FROM grading_systems WHERE id = ? AND deleted = 0`;
        let values = [grading_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0];
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
  },
  Mutation: {
    saveGrading: async (parent, args) => {
      const { id, grading_title, description, added_by } = args;
      // we need the current date
      const today = new Date();

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE grading_systems SET grading_title = ?, description = ?, added_by = ? WHERE id = ?`;

          let values = [grading_title, description, added_by, id];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No grading with id ${id}`, {
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
          let sql = `INSERT INTO grading_systems(grading_title, description, added_by) VALUES (?, ?, ?)`;

          let values = [grading_title, description, added_by];
          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert grading");
        }
      }

      const result = await getAllGrading();
      // console.log("the schools", results);

      return result; // returning all schools
    },
    saveGradingDetails: async (parent, args) => {
      const {
        id,
        grading_id,
        min_value,
        max_value,
        grade_point,
        grade_letter,
        added_by,
      } = args;
      // we need the current date
      const today = new Date();

      // check for the id, if present, we update otherwise we create a new record
      if (id) {
        // update
        try {
          let sql = `UPDATE grading_system_details SET grading_system_id = ?, min_value = ?, max_value = ?, grade_point = ?, grade_letter = ?, added_by = ?  WHERE id = ?`;

          let values = [
            grading_id,
            min_value,
            max_value,
            grade_point,
            grade_letter,
            added_by,
            id,
          ];

          const [results, fields] = await db.execute(sql, values);

          // console.log("the results", results);
          if (results.affectedRows == 0) {
            // no record the provided id
            throw new GraphQLError(`No grading with id ${id}`, {
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
          let sql = `INSERT INTO grading_system_details(grading_system_id, min_value, max_value, grade_point, grade_letter, added_by) VALUES (?, ?, ?, ?, ?, ?)`;

          let values = [
            grading_id,
            min_value,
            max_value,
            grade_point,
            grade_letter,
            added_by,
          ];

          const [results, fields] = await db.execute(sql, values);
        } catch (error) {
          console.log("error", error);
          throw new GraphQLError("Failed to insert grading");
        }
      }

      const result = await getGradingDetails(grading_id);
      // console.log("the schools", results);

      return result; // returning all schools
    },

    deleteGradingDetail: async (parent, args) => {
      try {
        const { grading_detail_id, grading_id } = args;

        let sql = `UPDATE grading_system_details SET deleted = 1 WHERE id = ?`;

        let values = [grading_detail_id];

        const [results, fields] = await db.execute(sql, values);

        // console.log("the results", results);
        if (results.affectedRows == 0 || results.changedRows == 0) {
          // no record the provided id
          throw new GraphQLError(
            `No grading system with id ${grading_detail_id}`,
            {
              extensions: {
                // code: '',
                http: { status: 400 },
              },
            }
          );
        }

        const result = await getGradingDetails(grading_id);
        return result;
      } catch (error) {
        throw new GraphQLError(error);
      }
    },
  },
};

export default gradingResolvers;
