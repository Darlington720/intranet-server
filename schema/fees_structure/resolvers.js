import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
// import generateUniqueID from "../../utilities/generateUniqueID.js";
// import saveData from "../../utilities/db/saveData.js";
// import softDelete from "../../utilities/db/softDelete.js";
import { getTuitionFees } from "../tuition_fees/resolvers.js";
import { getFunctionalFees } from "../functional_fee/resolvers.js";
import { getOtherFees } from "../other_fee/resolvers.js";
import distributeTuitionFees from "../../utilities/distributeTuitionFees.js";
import distributeFees from "../../utilities/distributeFeesToSemesters.js";

const feesStructureRessolver = {
  Query: {
    calculateFeesStructure: async (parent, args) => {
      const {
        acc_yr_id,
        campus_id,
        intake_id,
        course_id,
        nationality_category_id,
        study_time_id,
        level_id,
        study_yrs,
        other_fees,
        course_duration,
      } = args;

      // Helper function to fetch tuition fees
      const fetchTuitionFees = async () => {
        return await getTuitionFees({
          acc_yr_id,
          campus_id,
          intake_id,
          course_id,
          nationality_category_id,
          study_yrs,
          study_time_id,
        });
      };

      // Helper function to fetch functional fees
      const fetchFunctionalFees = async () => {
        return await getFunctionalFees({
          acc_yr_id,
          campus_id,
          intake_id,
          level_id,
          nationality_category_id,
          study_time_id,
        });
      };

      // Helper function to fetch other fees
      const fetchOtherFees = async () => {
        return await getOtherFees({
          other_fees_ids: other_fees,
        });
      };

      // Fetch all fees concurrently
      const [tuition_fees, functional_fees, _other_fees] = await Promise.all([
        fetchTuitionFees(),
        fetchFunctionalFees(),
        fetchOtherFees(),
      ]);

      const feesStructure = [
        ...tuition_fees,
        ...functional_fees,
        ..._other_fees,
      ];

      // distribute tuition fees
      const distributedTuitionFees = await distributeTuitionFees(
        course_duration,
        tuition_fees,
        2
      );

      // now, lets distribute functional fees
      const distributedFunctionalFees = await distributeFees(
        course_duration,
        functional_fees,
        2 // number of semester per acc year
      );

      // lastly, lets distribute other fees
      const distributedOtherFees = await distributeFees(
        course_duration,
        _other_fees,
        2
      );

      // console.log("distributed fees", distributedOtherFees);

      // console.log("tuition fees", tuition_fees);
      // Return combined fees structure
      return [
        ...distributedTuitionFees,
        ...distributedFunctionalFees,
        ...distributedOtherFees,
      ];
    },
  },
  FeeStructure: {
    category: async (parent, args) => {
      try {
        const category_id = parent.category_id;
        let sql = `SELECT * FROM fees_categories WHERE id = ?`;

        let values = [category_id];

        const [results, fields] = await db.execute(sql, values);
        // console.log("results", results);
        return results[0];
      } catch (error) {
        // console.log("error", error);
        throw new GraphQLError(error.message);
      }
    },
  },
  Mutation: {
    // copyFeesStructure: async (parent, args) => {
    //   const {
    //     from_acc_yr_id,
    //     from_campus_id,
    //     from_intake_id,
    //     to_acc_yr_id,
    //     to_campus_id,
    //     to_intake_id,
    //     scope,
    //     overwrite,
    //     added_by,
    //   } = args;

    //   const today = new Date();
    //   let connection = await db.getConnection();

    //   try {
    //     // Start a transaction to ensure atomicity

    //     await connection.beginTransaction();

    //     // Loop through each scope (tuition, functional, other_fees, etc.)
    //     for (const s of scope) {
    //       let tableName;
    //       let sql;
    //       let values = [from_acc_yr_id, from_campus_id, from_intake_id];

    //       // Determine table and SQL query based on scope
    //       if (s === "tuition") {
    //         tableName = "tuition_fees";
    //         sql =
    //           "SELECT * FROM tuition_fees WHERE acc_yr_id = ? AND campus_id = ? AND intake_id = ? AND deleted = 0";
    //       } else if (s === "functional") {
    //         tableName = "functional_fees";
    //         sql =
    //           "SELECT * FROM functional_fees WHERE acc_yr_id = ? AND campus_id = ? AND intake_id = ? AND deleted = 0";
    //       } else if (s === "other") {
    //         tableName = "other_fees";
    //         sql =
    //           "SELECT * FROM other_fees WHERE acc_yr_id = ? AND campus_id = ? AND intake_id = ? AND deleted = 0";
    //       }

    //       if (sql) {
    //         const [results] = await db.execute(sql, values);

    //         if (results.length > 0) {
    //           // Construct new records for insertion based on scope
    //           const fieldsToInsert = results.map((item) => ({
    //             acc_yr_id: to_acc_yr_id,
    //             campus_id: to_campus_id,
    //             intake_id: to_intake_id,
    //             ...(s === "tuition"
    //               ? {
    //                   school_id: item.school_id,
    //                   course_id: item.course_id,
    //                   study_yr: item.study_yr,
    //                   study_time_id: item.study_time_id,
    //                   frequency_code: item.frequency_code,
    //                 }
    //               : s === "functional"
    //               ? {
    //                   level_id: item.level_id,
    //                   study_time_id: item.study_time_id,
    //                   frequency_code: item.frequency_code,
    //                 }
    //               : {}),
    //             nationality_category_id: item.nationality_category_id,
    //             item_id: item.item_id,
    //             amount: item.amount,
    //             added_by,
    //             added_on: today,
    //           }));

    //           // Bulk check for duplicates and insert or update as necessary
    //           for (const field of fieldsToInsert) {
    //             let checkSql = `SELECT id FROM ${tableName} WHERE acc_yr_id = ? AND campus_id = ? AND intake_id = ? AND item_id = ? AND deleted = 0`;
    //             let checkValues = [
    //               field.acc_yr_id,
    //               field.campus_id,
    //               field.intake_id,
    //               field.item_id,
    //             ];

    //             if (s === "tuition") {
    //               checkSql += ` AND school_id = ? AND course_id = ? AND study_yr = ? AND study_time_id = ? AND frequency_code = ?`;
    //               checkValues.push(
    //                 field.school_id,
    //                 field.course_id,
    //                 field.study_yr,
    //                 field.study_time_id,
    //                 field.frequency_code
    //               );
    //             } else if (s === "functional") {
    //               checkSql += ` AND level_id = ? AND study_time_id = ? AND frequency_code = ?`;
    //               checkValues.push(
    //                 field.level_id,
    //                 field.study_time_id,
    //                 field.frequency_code
    //               );
    //             }

    //             const [existing] = await db.execute(checkSql, checkValues);

    //             if (existing.length > 0) {
    //               if (overwrite) {
    //                 // Perform an update if a duplicate exists and overwrite is true
    //                 let updateSql = `UPDATE ${tableName} SET amount = ?, added_by = ?, added_on = ? WHERE id = ?`;
    //                 let updateValues = [
    //                   field.amount,
    //                   field.added_by,
    //                   field.added_on,
    //                   existing[0].id,
    //                 ];
    //                 await db.execute(updateSql, updateValues);
    //               } else {
    //                 // Log skipping if not overwriting
    //                 console.log(
    //                   `Skipping duplicate record for ${tableName} with item_id: ${field.item_id}`
    //                 );
    //               }
    //             } else {
    //               // Insert the new record if no duplicate exists
    //               let insertSql = `INSERT INTO ${tableName} (acc_yr_id, campus_id, intake_id, nationality_category_id, item_id, amount, added_by, added_on${
    //                 s === "tuition"
    //                   ? ", school_id, course_id, study_yr, study_time_id, frequency_code"
    //                   : s === "functional"
    //                   ? ", level_id, study_time_id, frequency_code"
    //                   : ""
    //               }) VALUES (?, ?, ?, ?, ?, ?, ?, ?${
    //                 s === "tuition"
    //                   ? ", ?, ?, ?, ?, ?"
    //                   : s === "functional"
    //                   ? ", ?, ?, ?"
    //                   : ""
    //               })`;
    //               let insertValues = [
    //                 field.acc_yr_id,
    //                 field.campus_id,
    //                 field.intake_id,
    //                 field.nationality_category_id,
    //                 field.item_id,
    //                 field.amount,
    //                 field.added_by,
    //                 field.added_on,
    //               ];

    //               if (s === "tuition") {
    //                 insertValues.push(
    //                   field.school_id,
    //                   field.course_id,
    //                   field.study_yr,
    //                   field.study_time_id,
    //                   field.frequency_code
    //                 );
    //               } else if (s === "functional") {
    //                 insertValues.push(
    //                   field.level_id,
    //                   field.study_time_id,
    //                   field.frequency_code
    //                 );
    //               }

    //               // console.log(insertValues);

    //               await db.execute(insertSql, insertValues);
    //             }
    //           }
    //         }
    //       }
    //     }

    //     // Commit the transaction
    //     await connection.commit();

    //     return {
    //       success: "true",
    //       message: "Fees Structure Copied Successfully",
    //     };
    //   } catch (error) {
    //     console.log("error", error.message);
    //     await connection.rollback(); // Rollback in case of error

    //     throw new GraphQLError(error.message);
    //   } finally {
    //     // await db.re();
    //   }
    // },
    copyFeesStructure: async (parent, args) => {
      const {
        from_acc_yr_id,
        from_campus_id,
        from_intake_id,
        to_acc_yr_id,
        to_campus_id,
        to_intake_id,
        scope,
        overwrite,
        added_by,
      } = args;

      const today = new Date();
      let connection;

      try {
        connection = await db.getConnection();
        await connection.beginTransaction(); // Start transaction

        for (const s of scope) {
          let tableName, sql;
          let values = [from_acc_yr_id, from_campus_id, from_intake_id];

          switch (s) {
            case "tuition":
              tableName = "tuition_fees";
              sql = `SELECT * FROM tuition_fees WHERE acc_yr_id = ? AND campus_id = ? AND intake_id = ? AND deleted = 0`;
              break;
            case "functional":
              tableName = "functional_fees";
              sql = `SELECT * FROM functional_fees WHERE acc_yr_id = ? AND campus_id = ? AND intake_id = ? AND deleted = 0`;
              break;
            case "other":
              tableName = "other_fees";
              sql = `SELECT * FROM other_fees WHERE acc_yr_id = ? AND campus_id = ? AND intake_id = ? AND deleted = 0`;
              break;
            default:
              console.error(`Unknown scope: ${s}`);
              continue;
          }

          const [results] = await connection.execute(sql, values);

          if (results.length > 0) {
            for (const item of results) {
              let checkSql = `SELECT id FROM ${tableName} WHERE acc_yr_id = ? AND campus_id = ? AND intake_id = ? AND item_id = ? AND deleted = 0`;
              let checkValues = [
                to_acc_yr_id,
                to_campus_id,
                to_intake_id,
                item.item_id,
              ];

              let insertFields = {
                acc_yr_id: to_acc_yr_id,
                campus_id: to_campus_id,
                intake_id: to_intake_id,
                nationality_category_id: item.nationality_category_id,
                item_id: item.item_id,
                amount: item.amount,
                added_by,
                added_on: today,
              };

              if (s === "tuition") {
                Object.assign(insertFields, {
                  school_id: item.school_id,
                  course_id: item.course_id,
                  study_yr: item.study_yr,
                  study_time_id: item.study_time_id,
                  frequency_code: item.frequency_code,
                });
                checkSql += ` AND school_id = ? AND course_id = ? AND study_yr = ? AND study_time_id = ? AND frequency_code = ?`;
                checkValues.push(
                  item.school_id,
                  item.course_id,
                  item.study_yr,
                  item.study_time_id,
                  item.frequency_code
                );
              } else if (s === "functional") {
                Object.assign(insertFields, {
                  level_id: item.level_id,
                  study_time_id: item.study_time_id,
                  frequency_code: item.frequency_code,
                });
                checkSql += ` AND level_id = ? AND study_time_id = ? AND frequency_code = ?`;
                checkValues.push(
                  item.level_id,
                  item.study_time_id,
                  item.frequency_code
                );
              }

              const [existing] = await connection.execute(
                checkSql,
                checkValues
              );

              if (existing.length > 0) {
                if (overwrite) {
                  const updateSql = `UPDATE ${tableName} SET amount = ?, added_by = ?, added_on = ? WHERE id = ?`;
                  const updateValues = [
                    insertFields.amount,
                    insertFields.added_by,
                    insertFields.added_on,
                    existing[0].id,
                  ];
                  await connection.execute(updateSql, updateValues);
                } else {
                  console.log(
                    `Skipping duplicate record for ${tableName} with item_id: ${item.item_id}`
                  );
                }
              } else {
                const insertSql = `INSERT INTO ${tableName} (${Object.keys(
                  insertFields
                ).join(", ")}) VALUES (${Object.keys(insertFields)
                  .map(() => "?")
                  .join(", ")})`;

                await connection.execute(
                  insertSql,
                  Object.values(insertFields)
                );
              }
            }
          }
        }

        await connection.commit();
        return {
          success: "true",
          message: "Fees Structure Copied Successfully",
        };
      } catch (error) {
        console.error("Error copying fees structure:", error.message);
        if (connection) await connection.rollback();
        throw new GraphQLError(error.message);
      } finally {
        if (connection) connection.release();
      }
    },
  },
};

export default feesStructureRessolver;
