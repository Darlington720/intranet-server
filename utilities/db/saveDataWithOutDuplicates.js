import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

const saveDataWithOutDuplicates = async ({
  table,
  id,
  data,
  uniqueField = null,
}) => {
  try {
    // console.log("The data:", data);

    // Handle array case (bulk insert)
    if (Array.isArray(data)) {
      let columns = Object.keys(data[0]);
      let placeholders = columns.map(() => "?").join(", ");
      let sql = `INSERT INTO ${table} (${columns.join(
        ", "
      )}) VALUES (${placeholders})`;

      const promises = data.map(async (row) => {
        if (uniqueField) {
          // Check if record exists
          const [existing] = await db.execute(
            `SELECT id FROM ${table} WHERE ${uniqueField} = ?`,
            [row[uniqueField]]
          );
          if (existing.length > 0) {
            // Update if exists
            let setClause = columns.map((col) => `${col} = ?`).join(", ");
            let updateSql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
            let values = Object.values(row);
            values.push(existing[0].id);
            await db.execute(updateSql, values);
            return existing[0].id;
          }
        }

        // Insert if not exists
        let values = Object.values(row);
        const [result] = await db.execute(sql, values);
        return result.insertId;
      });

      return await Promise.all(promises);
    }

    // Handle single object case
    let columns = Object.keys(data);
    let values = Object.values(data);

    if (id) {
      // Update
      let setClause = columns.map((col) => `${col} = ?`).join(", ");
      let sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
      values.push(id); // Append the ID for the WHERE clause

      const [results] = await db.execute(sql, values);
      if (!results.affectedRows) {
        return 0;
      }
      return id;
    } else if (uniqueField) {
      // Check if record exists
      const [existing] = await db.execute(
        `SELECT id FROM ${table} WHERE ${uniqueField} = ?`,
        [data[uniqueField]]
      );
      if (existing.length > 0) {
        // Update if exists
        let setClause = columns.map((col) => `${col} = ?`).join(", ");
        let sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
        values.push(existing[0].id);
        await db.execute(sql, values);
        return existing[0].id;
      }
    }

    // Insert if not exists
    let placeholders = columns.map(() => "?").join(", ");
    let sql = `INSERT INTO ${table} (${columns.join(
      ", "
    )}) VALUES (${placeholders})`;

    const [result] = await db.execute(sql, values);
    return result.insertId;
  } catch (error) {
    console.error(error.message);
    throw new GraphQLError(error.message);
  }
};

export default saveDataWithOutDuplicates;
