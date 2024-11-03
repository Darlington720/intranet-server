import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
import generateUniqueID from "../../utilities/generateUniqueID.js";
import generateRefNo from "../../utilities/generatePaymentReferenceNo.js";
import saveData from "../../utilities/db/saveData.js";

const getPRT = async ({ id }) => {
  try {
    let values = [];
    let where = "";

    if (id) {
      where += " AND  id = ?";
      values.push(id);
    }

    let sql = `SELECT * FROM payment_reference_tokens WHERE deleted = 0 ${where}`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
    throw new GraphQLError("Error fetching PRT");
  }
};

const paymentReferenceTokenResolvers = {
  Query: {
    prts: async () => {
      // const result = await getAllAwards();
      // return result;
    },
  },
  // PaymentReferenceToken: {
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
  //   level: async (parent, args) => {
  //     try {
  //       const level_id = parent.level_id;
  //       let sql = `SELECT * FROM levels WHERE id = ?`;

  //       let values = [level_id];

  //       const [results, fields] = await db.execute(sql, values);
  //       // console.log("results", results);
  //       return results[0]; // expecting the level
  //     } catch (error) {
  //       // console.log("error", error);
  //       throw new GraphQLError("Error fetching level", {
  //         extensions: {
  //           code: "UNAUTHENTICATED",
  //           http: { status: 501 },
  //         },
  //       });
  //     }
  //   },
  // },
  Mutation: {
    generatePRT: async (parent, args) => {
      const { id, student_no, amount, type, invoices, generated_by } = args;
      const today = new Date();
      let allocations = null;

      // first lets genertae the unique token
      const prt = generateRefNo();

      // lets prepare the allocations data
      if (type == "prepayment_ref") {
        allocations = "pp";
      } else if (type == "invoice_ref") {
        // console.log("invoices received", JSON.parse(invoices));
        allocations = JSON.parse(invoices)
          .map((invoice) => `${invoice.invoice_no}:${invoice.allocate_amount}`)
          .join(", ");
      } else {
        throw new GraphQLError("Invalid Type!!!");
      }

      //  lets prepare the data
      const data = {
        student_no,
        type,
        prt,
        amount,
        allocations,
        prt_expiry: today,
        created_at: today,
        invoices, // serialise the invoices
        generated_by,
      };

      // save the prt
      const result = await saveData({
        table: "payment_reference_tokens",
        id: null,
        data,
      });

      const generatedPrt = await getPRT({
        id: result,
      });
      // console.log("result", generatedPrt);

      return generatedPrt[0];
    },
  },
};

export default paymentReferenceTokenResolvers;
