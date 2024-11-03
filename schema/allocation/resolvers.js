import { GraphQLError } from "graphql";
import { tredumoDB, db } from "../../config/config.js";

export const getInvoiceAllocations = async ({ invoice_no } = {}) => {
  try {
    let where = "";
    let values = [];

    if (invoice_no) {
      where += " AND allocations.invoice_no = ?";
      values.push(invoice_no);
    }

    let sql = `SELECT * FROM allocations WHERE deleted = 0 ${where} ORDER BY id ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    // console.log("error", error);
    throw new GraphQLError("Error fetching Allocations " + error.message);
  }
};

const allocationResolvers = {
  Query: {
    allocations: async () => {
      // try {
      //   const centres = await getUnebCentres();
      //   // console.log("centers", centres);
      //   return centres;
      // } catch (error) {
      //   console.log(error);
      //   throw new GraphQLError(error.message);
      // }
    },
  },
};

export default allocationResolvers;
