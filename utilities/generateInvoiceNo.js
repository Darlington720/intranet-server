import { db } from "../config/config.js";

const generateInvoiceNo = async ({
  student_no,
  invoice_category,
  is_other_fee = false,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0"); // Add leading zero for months less than 10
  let invoice_category_first_letter;

  if (is_other_fee) {
    if (invoice_category == "DEAD SEMESTER") {
      invoice_category_first_letter = "DEAD";
    }
  } else {
    invoice_category_first_letter = invoice_category.charAt(0).toUpperCase();
  }

  let invoice_count = 0;

  // Look through to get the last invoice_no
  let sql = `SELECT COUNT(id) AS invoice_count FROM student_invoices WHERE student_no = ? AND invoice_category = ?`;
  let values = [student_no, invoice_category];
  const [result] = await db.execute(sql, values);

  if (result && result[0] && result[0].invoice_count) {
    invoice_count = result[0].invoice_count + 1; // Increment based on current count
  } else {
    invoice_count = 1; // If no previous invoices, start at 1
  }

  // Return the formatted invoice number
  return `${student_no}-${invoice_category_first_letter}${currentYear}${currentMonth}${invoice_count
    .toString()
    .padStart(3, "0")}`;
};

export default generateInvoiceNo;
