import { GraphQLError } from "graphql";
import { tredumoDB, db } from "../../config/config.js";

export const getStdTransactions = async ({ student_no } = {}) => {
  try {
    let where = "";
    let values = [];

    if (student_no) {
      where += " AND transactions.student_no = ?";
      values.push(student_no);
    }

    let sql = `SELECT * FROM transactions WHERE deleted = 0 ${where} ORDER BY payment_date DESC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError(
      "Error fetching student transactions " + error.message
    );
  }
};

const transactionResolvers = {
  Query: {
    student_transactions: async (_, args) => {
      try {
        const { student_no } = args;
        const stdTxns = await getStdTransactions({
          student_no,
        });
        // console.log("centers", centres);
        return stdTxns;
      } catch (error) {
        console.log(error);
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default transactionResolvers;
