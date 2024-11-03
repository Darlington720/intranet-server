import { GraphQLError } from "graphql";
import { db } from "../config/config.js";

// let currentYear = new Date().getFullYear(); // Initialize the current year

// async function generateStdno() {
//   // first check the last generated number
//   try {
//     let sql = "SELECT * FROM students ORDER BY id DESC LIMIT 1";

//     const [results, fields] = await db.execute(sql);

//     let currentNumber = results[0] ? results[0].student_no : null;

//     if (
//       !currentNumber ||
//       parseInt(currentNumber.slice(0, 2), 10) !== currentYear % 100
//     ) {
//       currentYear = new Date().getFullYear();
//       return `${currentYear.toString().slice(2)}00100001`;
//     }

//     // Extract the counter part (last 5 digits)
//     const currentCounter = parseInt(currentNumber.slice(-5), 10);

//     // Increment the counter
//     const nextCounter = currentCounter + 1;

//     // Generate the next number
//     const nextNumber = `${currentYear.toString().slice(2)}001${nextCounter
//       .toString()
//       .padStart(5, "0")}`;

//     return nextNumber;
//   } catch (error) {
//     throw new GraphQLError(error.message);
//   }
// }

let currentYear = new Date().getFullYear(); // Initialize the current year
let currentMonth = new Date().getMonth(); // Get the current month (0-11, where 0 is January and 11 is December)

// Adjust the year based on the academic year (August-July)
if (currentMonth < 7) {
  // If it's before August (0-6), it belongs to the previous academic year
  currentYear = currentYear - 1;
}

async function generateStdno() {
  // First, check the last generated number
  try {
    let sql = "SELECT * FROM students ORDER BY id DESC LIMIT 1";
    const [results, fields] = await db.execute(sql);

    let currentNumber = results[0] ? results[0].student_no : null;

    if (
      !currentNumber ||
      parseInt(currentNumber.slice(0, 2), 10) !== currentYear % 100
    ) {
      return `${currentYear.toString().slice(2)}00100001`;
    }

    // Extract the counter part (last 5 digits)
    const currentCounter = parseInt(currentNumber.slice(-5), 10);

    // Increment the counter
    const nextCounter = currentCounter + 1;

    // Generate the next number
    const nextNumber = `${currentYear.toString().slice(2)}001${nextCounter
      .toString()
      .padStart(5, "0")}`;

    return nextNumber;
  } catch (error) {
    throw new GraphQLError(error.message);
  }
}

// console.log("stdno", await generateStdno());

export default generateStdno;
