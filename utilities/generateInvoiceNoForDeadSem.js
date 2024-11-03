import { db } from "../config/config.js";

const generateInvoiceNoForDeadSem = async ({
  student_no,
  invoice_category = "DEAD_SEM",
  study_yr,
  sem,
}) => {
  let invoice_category_first_letter;

  invoice_category_first_letter = `DEADSEM-YEAR-${study_yr}-SEM-${sem}`;

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
  return `${student_no}-${invoice_category_first_letter}`;
};

export default generateInvoiceNoForDeadSem;
