import { db } from "../config/config.js";
// Function to generate course unit code and ensure it's unique
const generateCourseUnitCode = async (courseCode) => {
  let isUnique = false;
  let courseUnitCode;

  while (!isUnique) {
    // Generate a random 4-digit number as suffix
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // Generates a number between 1000 and 9999
    courseUnitCode = `${courseCode}${randomSuffix}`;

    // Check in the database if this course_unit_code already exists
    let sql =
      "SELECT COUNT(*) as count FROM course_units WHERE course_unit_code = ?";
    let values = [courseUnitCode];

    const [results, fields] = await db.execute(sql, values);

    // If count is 0, then the code is unique
    if (results[0].count === 0) {
      isUnique = true;
    }
  }

  return courseUnitCode;
};

export default generateCourseUnitCode;
