import { GraphQLError } from "graphql";

let currentYear = new Date().getFullYear(); // Initialize the current year

function generateRegNo({ intake, course_code, level, study_time }) {
  // first check the last generated number
  try {
    let uniqueIdLength = 6;
    // 2021/FEB/BCS/B227811/DAY
    // Get the current year
    const year = new Date().getFullYear();

    // Convert intake to three-letter abbreviation
    const month = intake.substring(0, 3).toUpperCase();

    // course code
    const courseCode = course_code.toUpperCase();

    // Determine the level prefix (B, D, etc.)
    const levelPrefix = level.substring(0, 1).toUpperCase();

    const studyTime = study_time.toUpperCase();

    // Generate a numeric unique identifier
    const numericUniqueId = Math.floor(
      Math.random() * Math.pow(10, uniqueIdLength)
    )
      .toString()
      .padStart(uniqueIdLength, "0");

    let studyTimeAbrev;
    switch (studyTime) {
      case "DAY":
        studyTimeAbrev = "DAY";
        break;
      case "WEEKEND":
        studyTimeAbrev = "WKD";
        break;
      case "EVENING":
        studyTimeAbrev = "EVE";
        break;
      case "DISTANCE":
        studyTimeAbrev = "DIST";
        break;
      default:
        studyTimeAbrev = typeOrStatus.toUpperCase(); // Default to uppercase if not matching
    }

    // Format the identifier
    const reg_no = `${year}/${month}/${courseCode}/${levelPrefix}${numericUniqueId}/${studyTimeAbrev}`;

    return reg_no;
  } catch (error) {
    throw new GraphQLError(error.message);
  }
}

export default generateRegNo;
