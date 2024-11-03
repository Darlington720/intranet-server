const calculateCurrentSemester = (
  intakeYear,
  currentYear,
  programDuration,
  intakeMonth = "AUGUST"
) => {
  const isFebruaryIntake = intakeMonth === "February";
  const yearsElapsed = currentYear - intakeYear;
  // Adjust for February intake
  let currentStudyYear, currentSemester, academicYear;

  // Check if program duration is exceeded
  if (yearsElapsed >= programDuration) {
    if (isFebruaryIntake) {
      const month = new Date().getMonth(); // Get current month (0-based, 0 = Jan, 1 = Feb)

      if (month >= 1 && month <= 4) {
        currentSemester = 1; // February - May
        academicYear = `${currentYear - 1}/${currentYear}`;
      } else if (month >= 7 && month <= 10) {
        currentSemester = 2; // AUGUST - November
        academicYear = `${currentYear}/${currentYear + 1}`;
      } else {
        currentSemester = "Holiday";
      }
    } else {
      // Logic for AUGUST intake
      academicYear = `${currentYear}/${currentYear + 1}`;

      const isInFirstSemester = new Date().getMonth() >= 7; // Aug-Nov
      currentSemester = isInFirstSemester ? 1 : 2;
    }
    return {
      currentStudyYear: "Completed",
      currentSemester,
      academicYear,
    };
  }

  if (isFebruaryIntake) {
    const month = new Date().getMonth(); // Get current month (0-based, 0 = Jan, 1 = Feb)

    // Calculate study year based on February start
    currentStudyYear = Math.min(yearsElapsed + 1, programDuration);

    if (month >= 1 && month <= 4) {
      currentSemester = 1; // February - May
      academicYear = `${currentYear - 1}/${currentYear}`;
    } else if (month >= 7 && month <= 10) {
      currentSemester = 2; // AUGUST - November
      academicYear = `${currentYear}/${currentYear + 1}`;
    } else {
      currentSemester = "Holiday";
    }
  } else {
    // Logic for AUGUST intake
    currentStudyYear = Math.min(yearsElapsed + 1, programDuration);
    academicYear = `${currentYear}/${currentYear + 1}`;

    const isInFirstSemester = new Date().getMonth() >= 7; // Aug-Nov
    currentSemester = isInFirstSemester ? 1 : 2;
  }

  return { currentStudyYear, currentSemester, academicYear };
};

const getStudentProgress = async ({
  entryAccYear,
  intakeMonth,
  courseDuration,
}) => {
  const currentYear = new Date().getFullYear();
  //   const currentYear = 2023;

  return calculateCurrentSemester(
    entryAccYear,
    currentYear,
    courseDuration,
    intakeMonth
  ); // 3 years program
};

// console.log(
//   "current student details AUGUST",
//   await getStudentProgress({
//     entryAccYear: 2021,
//     intakeMonth: "AUGUST",
//     courseDuration: 3,
//   })
// );

// console.log(
//   "current student details Feb",
//   await getStudentProgress({
//     entryAccYear: 2020,
//     intakeMonth: "February",
//     courseDuration: 3,
//   })
// );

export default getStudentProgress;
