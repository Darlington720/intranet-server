import moment from "moment";
import getStudentProgress from "./calculateCurrentSemester.js";

// const calculateSemestersSkipped = (
//   entryAccYear,
//   intakeMonth,
//   currentStudyYear,
//   currentSemester,
//   currentAcademicYear,

// ) => {
//   const currentDate = moment(); // Assume the current date

//   // Determine the intake year based on the academic year and intake month
//   const [startYear, endYear] = entryAccYear.split("/").map(Number);
//   const intakeYear = intakeMonth === "AUGUST" ? startYear : endYear;

//   // Intake month "AUGUST" or "February" determines the semester cycles
//   const intakeDate =
//     intakeMonth === "AUGUST"
//       ? moment(`${intakeYear}-08-01`)
//       : moment(`${intakeYear}-02-01`);

//   const currentAcademicStartYear = parseInt(currentAcademicYear.split("/")[0]);

//   // Calculate expected semesters from the intake to current date
//   let expectedSemesters = 0;
//   let yearsElapsed = currentAcademicStartYear - intakeYear;

//   if (intakeMonth === "AUGUST") {
//     expectedSemesters = yearsElapsed * 2; // 2 semesters per year
//     if (currentDate.month() >= 7 && currentDate.month() <= 11) {
//       expectedSemesters += 1; // Midway through semester 1
//     } else if (currentDate.month() >= 1 && currentDate.month() <= 5) {
//       expectedSemesters += 2; // Midway through semester 2
//     }
//   } else if (intakeMonth === "February") {
//     expectedSemesters = yearsElapsed * 2; // 2 semesters per year
//     if (currentDate.month() >= 1 && currentDate.month() <= 5) {
//       expectedSemesters += 1; // Midway through semester 1
//     } else if (currentDate.month() >= 7 && currentDate.month() <= 11) {
//       expectedSemesters += 2; // Midway through semester 2
//     }
//   }

//   // Calculate the current student's completed semesters (study year * 2)
//   let completedSemesters = (currentStudyYear - 1) * 2;
//   completedSemesters += currentSemester === "Semester 1" ? 1 : 2;

//   // Check for skipped semesters
//   let semestersSkipped = expectedSemesters - completedSemesters;

//   if (semestersSkipped > 0) {
//     return {
//       progress: "Behind",
//       semestersSkipped,
//       message: `The student has skipped ${semestersSkipped} semester(s).`,
//     };
//   } else if (semestersSkipped < 0) {
//     return {
//       progress: "Ahead",
//       semestersSkipped: Math.abs(semestersSkipped),
//       message: `The student is ahead by ${Math.abs(
//         semestersSkipped
//       )} semester(s).`,
//     };
//   } else {
//     return {
//       progress: "Normal",
//       semestersSkipped: 0,
//       message: "The student is on normal progress.",
//     };
//   }
// };

const calculateSemestersSkipped = (
  activeSem,
  entryAccYear,
  intakeMonth,
  currentStudyYear,
  currentSemester
) => {
  // Extract relevant information from the active semester object
  const activeAccYearTitle = activeSem.acc_yr_title; // e.g., '2024/2025'
  const activeSemester = parseInt(activeSem.semester); // e.g., '2' -> 2nd semester

  // Determine the intake year based on the entry academic year and intake month
  const [startYear, endYear] = entryAccYear.split("/").map(Number);
  const intakeYear = intakeMonth === "AUGUST" ? startYear : endYear;

  const activeAccStartYear = parseInt(activeAccYearTitle.split("/")[0]);

  // Calculate expected semesters since intake
  let expectedSemesters = 0;
  let yearsElapsed = activeAccStartYear - intakeYear;

  if (intakeMonth === "AUGUST") {
    expectedSemesters = yearsElapsed * 2;
    if (activeSemester === 1) {
      expectedSemesters += 1; // Currently in semester 1
    } else if (activeSemester === 2) {
      expectedSemesters += 2; // Currently in semester 2
    }
  } else if (intakeMonth === "February") {
    expectedSemesters = yearsElapsed * 2;
    if (activeSemester === 1) {
      expectedSemesters += 1; // Currently in semester 1
    } else if (activeSemester === 2) {
      expectedSemesters += 2; // Currently in semester 2
    }
  }

  // Calculate student's current progress (completed semesters)
  let completedSemesters = (currentStudyYear - 1) * 2;
  completedSemesters += currentSemester === "Semester 1" ? 1 : 2;

  // Determine if the student is on track, behind, or ahead
  let semestersSkipped = expectedSemesters - completedSemesters;

  if (semestersSkipped > 0) {
    return {
      progress: "Behind",
      semestersSkipped,
      message: `The student has skipped ${semestersSkipped} semester(s).`,
    };
  } else if (semestersSkipped < 0) {
    return {
      progress: "Ahead",
      semestersSkipped: Math.abs(semestersSkipped),
      message: `The student is ahead by ${Math.abs(
        semestersSkipped
      )} semester(s).`,
    };
  } else {
    return {
      progress: "Normal",
      semestersSkipped: 0,
      message: "The student is on normal progress.",
    };
  }
};

const current = await getStudentProgress({
  entryAccYear: "2022",
  intakeMonth: "February",
  courseDuration: 3,
});

// const result = calculateSemestersSkipped(
//   "2021/2022",
//   "February",
//   3,
//   2,
//   "2024/2025"
// );

// console.log(current);
// console.log("result", result);

export default calculateSemestersSkipped;
