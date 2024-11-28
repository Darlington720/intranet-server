import { db } from "../../config/config.js";
import saveData from "../db/saveData.js";
import generateUniqueID from "../generateUniqueID.js";

const fetchOrCreateRecord = async ({ table, field, value, user_id }) => {
  try {
    let sql = `SELECT * FROM ${table} WHERE deleted = 0 AND ${field} LIKE ?`;
    let values = [`%${value}%`];

    const [results] = await db.execute(sql, values);

    if (results.length > 0) {
      return results[0].id;
    }

    let newRecord = {
      [field]: value,
      added_by: user_id,
      added_on: new Date(),
    };

    if (table == "acc_yrs" || table == "study_times") {
      const unique_id = generateUniqueID();
      newRecord = {
        id: unique_id,
        [field]: value,
        added_by: user_id,
        added_on: new Date(),
      };
    }

    const save_id = await saveData({
      table,
      id: null,
      data: newRecord,
    });

    return save_id;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching campuses");
  }
};

export default fetchOrCreateRecord;
