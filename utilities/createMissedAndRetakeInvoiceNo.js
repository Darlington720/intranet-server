import { db } from "../config/config.js";

const createMissedAndRetakeInvoiceNo = async ({
  student_no,
  invoice_category = "retake",
  course_unit_code,
}) => {
  let invoice_category_first_letter;

  invoice_category_first_letter = `${invoice_category.toUpperCase()}-${course_unit_code}`;

  let count = 0;

  // Look through to get the last invoice_no
  let sql = `SELECT COUNT(id) AS count FROM student_registered_modules WHERE student_no = ? AND status = ?`;
  let values = [student_no, invoice_category];
  const [result] = await db.execute(sql, values);

  if (result && result[0] && result[0].count) {
    count = result[0].count + 1; // Increment based on current count
  } else {
    count = 1; // If no previous invoices, start at 1
  }

  // Return the formatted invoice number
  return `${student_no}-${invoice_category_first_letter}0${count}`;
};

export default createMissedAndRetakeInvoiceNo;
