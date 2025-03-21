import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

export const getAllSalutations = async ({
  salutation_code,
  salutation_description,
}) => {
  try {
    let conditions = ["deleted = 0"];
    let values = [];

    if (salutation_code) {
      conditions.push("salutation_code = ?");
      values.push(salutation_code);
    }

    if (salutation_description) {
      conditions.push("salutation_description LIKE ?");
      values.push(`%${salutation_description}%`); // Add wildcards for partial match
    }

    let whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";
    let sql = `SELECT * FROM salutations ${whereClause}`;

    const [results, fields] = await db.execute(sql, values);
    return results;
  } catch (error) {
    console.error("Error fetching salutations:", error);
    throw new GraphQLError("Error fetching salutations: " + error.message);
  }
};

const salutationResolvers = {
  Query: {
    salutations: async () => {
      const result = await getAllSalutations({});
      return result;
    },
  },
  // Level: {
  //   added_user: async (parent, args) => {
  //     try {
  //       const user_id = parent.added_by;
  //       let sql = `SELECT * FROM staff WHERE id = ?`;

  //       let values = [user_id];

  //       const [results, fields] = await db.execute(sql, values);
  //       // console.log("results", results);
  //       return results[0]; // expecting the one who added the user
  //     } catch (error) {
  //       // console.log("error", error);
  //       throw new GraphQLError("Error fetching user", {
  //         extensions: {
  //           code: "UNAUTHENTICATED",
  //           http: { status: 501 },
  //         },
  //       });
  //     }
  //   },
  //   modified_user: async (parent, args) => {
  //     try {
  //       const user_id = parent.modified_by;
  //       let sql = `SELECT * FROM staff WHERE id = ?`;

  //       let values = [user_id];

  //       const [results, fields] = await db.execute(sql, values);
  //       // console.log("results", results);
  //       return results[0]; // expecting the one who added the user
  //     } catch (error) {
  //       // console.log("error", error);
  //       throw new GraphQLError("Error fetching user", {
  //         extensions: {
  //           code: "UNAUTHENTICATED",
  //           http: { status: 501 },
  //         },
  //       });
  //     }
  //   },
  // },
  // Mutation: {
  //   saveLevel: async (parent, args) => {
  //     const unique_id = generateUniqueID();
  //     const { id, level_code, level_title, added_by } = args;
  //     const today = new Date();

  //     // console.log("the id", id);

  //     // check for the id, if present, we update otherwise we create a new record
  //     if (id) {
  //       // update
  //       try {
  //         let sql = `UPDATE levels SET level_code = ?, level_title = ?, modified_by = ?, modified_on = ? WHERE id = ?`;

  //         let values = [level_code, level_title, added_by, today, id];

  //         const [results, fields] = await db.execute(sql, values);

  //         // console.log("the results", results);
  //         if (results.affectedRows == 0) {
  //           // no record the provided id
  //           throw new GraphQLError(`No level with id ${id}`, {
  //             extensions: {
  //               // code: '',
  //               http: { status: 400 },
  //             },
  //           });
  //         }
  //       } catch (error) {
  //         // console.log("error", error);
  //         throw new GraphQLError(error, {
  //           extensions: {
  //             // code: '',
  //             http: { status: 400 },
  //           },
  //         });
  //       }
  //     } else {
  //       // create new record
  //       try {
  //         let sql = `INSERT INTO levels(id, level_code, level_title, added_on, added_by) VALUES (?, ?, ?, ?, ?)`;

  //         let values = [unique_id, level_code, level_title, today, added_by];

  //         const [results, fields] = await db.execute(sql, values);
  //       } catch (error) {
  //         console.log("error", error);
  //         throw new GraphQLError("Failed to insert level");
  //       }
  //     }

  //     let sql = `SELECT * FROM levels WHERE id = ?`;
  //     let values = [id ? id : unique_id];

  //     const [results, fields] = await db.execute(sql, values);

  //     return results[0]; // returning the inserted level
  //   },
  // },
};

export default salutationResolvers;
