import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

// const saveData = async ({ table, id, data }) => {
//   try {
//     let columns = Object.keys(data);
//     let values = Object.values(data);

//     if (id) {
//       // Update
//       let setClause = columns.map((col) => `${col} = ?`).join(", ");
//       let sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
//       values.push(id); // Append the id to the values array for the WHERE clause

//       const [results, fields] = await db.execute(sql, values);
//       if (!results.affectedRows) {
//         return 0;
//       }
//       return id;
//     } else {
//       // Insert
//       let placeholders = columns.map(() => "?").join(", ");
//       let sql = `INSERT INTO ${table} (${columns.join(
//         ", "
//       )}) VALUES (${placeholders})`;

//       const [results, fields] = await db.execute(sql, values);
//       return results.insertId;
//     }
//   } catch (error) {
//     console.log(error.message);
//     throw new GraphQLError(error.message);
//   }
// };

const saveData = async ({ table, id, data, idColumn = "id" }) => {
  try {
    // Handle array case separately
    if (Array.isArray(data)) {
      // Assuming you want to insert multiple rows for array data
      let columns = Object.keys(data[0]); // Columns from the first object in the array
      let placeholders = columns.map(() => "?").join(", ");
      let sql = `INSERT INTO ${table} (${columns.join(
        ", "
      )}) VALUES (${placeholders})`;

      const promises = data.map((row) => {
        let values = Object.values(row);
        console.log("row", row);
        return db.execute(sql, values);
      });

      const results = await Promise.all(promises);

      return results.map((result) => result[0].insertId); // Returning array of insertIds
    }

    // Handle object case (existing logic)
    let columns = Object.keys(data);
    let values = Object.values(data);

    if (id) {
      // Update

      let setClause = columns.map((col) => `${col} = ?`).join(", ");
      let sql = `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`;

      values.push(id); // Append the id to the values array for the WHERE clause

      const [results] = await db.execute(sql, values);

      if (!results.affectedRows) {
        if (!results.affectedRows) {
          //   return 0; // No rows were affected, possibly invalid ID
          throw new GraphQLError("No data that matched the provided id!");
        }
      }
      return id;
    } else {
      // Insert
      let placeholders = columns.map(() => "?").join(", ");
      let sql = `INSERT INTO ${table} (${columns.join(
        ", "
      )}) VALUES (${placeholders})`;

      const [results, fields] = await db.execute(sql, values);

      return results.insertId;
    }
  } catch (error) {
    // console.log("eroor save", error.message);
    throw new GraphQLError(error.message);
  }
};

export default saveData;
