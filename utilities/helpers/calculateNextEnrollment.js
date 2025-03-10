/**
 * Calculates next enrollment details based on student history and current academic period
 * @param {Object[]} enrollmentHistory - Array of previous enrollments
 * @param {string} currentAccYr - Current academic year (e.g., "2024/2025")
 * @param {number} currentSem - Current semester (1 or 2)
 * @param {number} courseDuration - Maximum duration of the course in years
 * @param {string} entryAccYr - Student's entry academic year (e.g., "2020/2021")
 * @returns {Object} Next enrollment details
 */
function calculateNextEnrollment({
  enrollmentHistory,
  currentAccYr,
  currentSem,
  courseDuration,
  entryAccYr,
}) {
  // Sort enrollment history by academic year and semester
  const sortedHistory = [...enrollmentHistory].sort((a, b) => {
    const yearDiff =
      parseInt(b.acc_yr_title.split("/")[0]) -
      parseInt(a.acc_yr_title.split("/")[0]);
    if (yearDiff === 0) {
      return parseInt(b.sem) - parseInt(a.sem);
    }
    return yearDiff;
  });

  // Get the latest enrollment
  const latestEnrollment = sortedHistory[0];

  if (!latestEnrollment) {
    return {
      study_year: "1",
      semester: "1",
      enrollment_status: ["new_student"],
    };
  }

  // Calculate expected study year and semester
  let expectedStudyYear = parseInt(latestEnrollment.study_yr);
  let expectedSem = parseInt(latestEnrollment.sem);

  // Increment semester/year based on current period
  if (expectedSem === 2) {
    expectedStudyYear < courseDuration
      ? expectedStudyYear++
      : (expectedStudyYear = courseDuration);

    expectedSem = 1;
  } else {
    expectedSem++;
  }

  // Calculate dead semesters
  const deadSemesters = calculateDeadSemesters(
    sortedHistory,
    entryAccYr,
    currentAccYr
  );

  // Check if student has exceeded course duration
  const totalYearsSpent = calculateTotalYearsSpent(
    entryAccYr,
    currentAccYr,
    deadSemesters
  );
  if (totalYearsSpent > courseDuration) {
    return {
      error: "Student has exceeded maximum course duration",
      totalYearsSpent,
      courseDuration,
    };
  }

  // Determine enrollment status
  let enrollmentStatus = determineEnrollmentStatus(
    sortedHistory,
    expectedStudyYear,
    expectedSem,
    deadSemesters,
    courseDuration
  );

  return {
    study_year: expectedStudyYear,
    semester: expectedSem,
    enrollment_status: enrollmentStatus,
    // dead_semesters: deadSemesters,
    total_years_spent: totalYearsSpent,
  };
}

/**
 * Calculate dead semesters with corresponding study years based on enrollment history
 */
function calculateDeadSemesters(enrollmentHistory, entryAccYr, currentAccYr) {
  const expectedSemesters = [];
  let currentYear = parseInt(entryAccYr.split("/")[0]);
  const endYear = parseInt(currentAccYr.split("/")[0]);
  let studyYear = 1;
  let currentSemester = 1;

  // Generate all expected semester periods with study years
  while (currentYear <= endYear) {
    expectedSemesters.push({
      period: `${currentYear}/${currentYear + 1}-${currentSemester}`,
      study_year: studyYear,
      academic_year: `${currentYear}/${currentYear + 1}`,
      semester: currentSemester,
    });

    // Increment semester and study year appropriately
    if (currentSemester === 2) {
      currentSemester = 1;
      currentYear++;
      studyYear++;
    } else {
      currentSemester = 2;
    }
  }

  // Create array of actual enrolled semesters
  const enrolledSemesters = enrollmentHistory.map((enrollment) => ({
    period: `${enrollment.acc_yr_title}-${enrollment.sem}`,
    study_year: parseInt(enrollment.study_yr),
    academic_year: enrollment.acc_yr_title,
    semester: parseInt(enrollment.sem),
  }));

  // Find missing semesters with their corresponding study years
  const deadSemesters = expectedSemesters.filter(
    (expectedSem) =>
      !enrolledSemesters.some(
        (enrolledSem) => enrolledSem.period === expectedSem.period
      )
  );

  return deadSemesters;
}

/**
 * Calculate total years spent in the course
 */
function calculateTotalYearsSpent(entryAccYr, currentAccYr, deadSemesters) {
  const entryYear = parseInt(entryAccYr.split("/")[0]);
  const currentYear = parseInt(currentAccYr.split("/")[0]);
  const normalYears = currentYear - entryYear;

  // Subtract dead semesters (2 dead semesters = 1 year)
  const deadYears = Math.floor(deadSemesters.length / 2);

  return normalYears - deadYears;
}

/**
 * Determine the appropriate enrollment status based on history and current situation
 */
export function determineEnrollmentStatus(
  history,
  expectedStudyYear,
  expectedSem,
  deadSemesters,
  courseDuration = 3
) {
  // Check if there are any retakes in recent history
  // const hasRecentRetakes = history.some((enrollment) =>
  //   enrollment.enrollment_status.title.includes("Retake")
  // );

  // Check if there are recent dead semesters
  // const hasRecentDeadSemesters = deadSemesters.length > 0;

  if (
    (parseInt(expectedStudyYear) == 1 && parseInt(expectedSem) == 2) ||
    (parseInt(expectedStudyYear) > 1 &&
      parseInt(expectedStudyYear) < courseDuration)
  ) {
    return ["continuing_student"];
  } else if (parseInt(expectedStudyYear) == courseDuration) {
    return [
      "graduation",
      "continuing_student",
      "finalist",
      "completed_with_retakes",
    ];
  } else {
    return ["continuing_student"];
  }
}

const enrollmentHistory = [];

// // Example usage:
// const result = calculateNextEnrollment(
//   enrollmentHistory,
//   "2024/2025", // current academic year
//   1, // current semester
//   3, // course duration in years
//   "2020/2021" // entry academic year
// );

// console.log("results", result);

export default calculateNextEnrollment;
