import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";

const softDelete = async ({ table, id }) => {
  try {
    if (!id) {
      throw new Error("ID is required for deletion.");
    }

    // Soft delete by setting the `deleted` column to 1
    let sql = `UPDATE ${table} SET deleted = 1 WHERE id = ?`;

    const [results, fields] = await db.execute(sql, [id]);

    // console.log("delete results", results);

    if (!results.affectedRows) {
      //   return 0; // No rows were affected, possibly invalid ID
      throw new GraphQLError("No data that matched the provided id!");
    }

    return { id, action: "deleted" }; // Return confirmation of deletion
  } catch (error) {
    // console.log(
    //   `Error in deleting record from table ${table}: ${error.message}`
    // );
    throw new GraphQLError(error.message);
  }
};

export default softDelete;
