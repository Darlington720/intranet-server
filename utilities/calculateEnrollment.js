// const generateSemesterList = (entryYear, courseDuration) => {
//   const semesters = [];
//   let year = parseInt(entryYear.split("/")[0]); // Extract the first part of the academic year
//   for (let i = 0; i < courseDuration * 2; i++) {
//     let semester = i % 2 === 0 ? 1 : 2; // Alternate between semester 1 and 2
//     semesters.push({
//       studyYear: Math.floor(i / 2) + 1, // Study year starts from 1 and increments
//       semester,
//       accYear: `${year}/${year + 1}`, // Academic year format
//     });
//     if (semester === 2) {
//       year += 1; // Move to the next academic year after semester 2
//     }
//   }
//   return semesters;
// };

const generateSemesterListForNormalProgress = (
  entryYear,
  courseDuration,
  entryStudyYear = 1,
  sem = 1
) => {
  const semesters = [];
  let year = parseInt(entryYear.split("/")[0]); // Extract the first part of the academic year
  let startingSemesterIndex = (parseInt(entryStudyYear) - 1) * 2; // Calculate the index to start from the given study year

  // Generate the list starting from the given study year
  for (let i = startingSemesterIndex; i < courseDuration * 2; i++) {
    let semester = i % 2 === 0 ? 1 : 2; // Alternate between semester 1 and 2
    semesters.push({
      studyYear: Math.floor(i / 2) + 1, // Study year starts from the given study year
      semester,
      accYear: `${year}/${year + 1}`, // Academic year format
    });
    if (semester === 2) {
      year += 1; // Move to the next academic year after semester 2
    }
  }
  return semesters;
};

// const generateSemesterList = (
//   entryYear,
//   courseDuration,
//   entryStudyYear = 1,
//   sem = 1
// ) => {
//   const semesters = [];
//   let year = parseInt(entryYear.split("/")[0]); // Extract the first part of the academic year
//   let startingSemesterIndex = (parseInt(entryStudyYear) - 1) * 2; // Calculate the index to start from the given study year

//   // Adjust starting index based on the provided starting semester
//   if (parseInt(sem) === 2) {
//     startingSemesterIndex += 1; // Move to the second semester of the starting study year
//   }

//   // Generate the list starting from the given study year and semester
//   for (let i = startingSemesterIndex; i < courseDuration * 2; i++) {
//     let semester = i % 2 === 0 ? 1 : 2; // Alternate between semester 1 and 2
//     semesters.push({
//       studyYear: Math.floor(i / 2) + 1, // Study year starts from the given study year
//       semester,
//       accYear: `${year}/${year + 1}`, // Academic year format
//     });
//     if (semester === 2) {
//       year += 1; // Move to the next academic year after semester 2
//     }
//   }
//   return semesters;
// };

// const generateSemesterList = (
//   entryYear,
//   courseDuration,
//   entryStudyYear = 1,
//   sem = 1,
//   enrollmentDate = new Date()
// ) => {
//   const semesters = [];
//   let year = parseInt(entryYear.split("/")[0]); // Extract the first part of the academic year
//   let startingSemesterIndex = (parseInt(entryStudyYear) - 1) * 2; // Calculate the index to start from the given study year

//   // Adjust starting index based on the provided starting semester
//   if (sem === 2) {
//     startingSemesterIndex += 1; // Move to the second semester of the starting study year
//   }

//   // Use the enrollment date as the baseline for calculating the semester months
//   let currentStartMonth = enrollmentDate.getMonth() + 1; // Get the enrollment start month (January is 0, so add 1)
//   let currentYear = enrollmentDate.getFullYear(); // Get the enrollment year

//   // Generate the list starting from the given study year and semester
//   for (let i = startingSemesterIndex; i < courseDuration * 2; i++) {
//     let semester = i % 2 === 0 ? 1 : 2; // Alternate between semester 1 and 2
//     let startMonth = currentStartMonth;

//     semesters.push({
//       studyYear: Math.floor(i / 2) + 1, // Study year starts from the given study year
//       semester,
//       accYear: `${year}/${year + 1}`, // Academic year format
//       //   enrollmentDate: new Date(currentYear, startMonth - 1, 1), // Enrollment date set for the 1st day of the month
//     });

//     // Increment the month by 6 to move to the next semester
//     currentStartMonth += 6;

//     // Check if we have moved to a new year (if current month exceeds 12)
//     if (currentStartMonth > 12) {
//       currentStartMonth -= 12; // Reset to the correct month within the new year
//       currentYear += 1; // Increment the year
//       year += 1; // Move to the next academic year
//     }
//   }
//   return semesters;
// };

//   // Example usage:
//   const entryYear = '2023/2024'; // Entry academic year
//   const courseDuration = 3; // 3 years of study
//   const entryStudyYear = 2; // Start from study year 2
//   const sem = 2; // Start from semester 2
//   const enrollmentDate = new Date('2023-08-01'); // Enrollment date (e.g., August 1, 2023)

//   const semesterList = generateSemesterList(entryYear, courseDuration, entryStudyYear, sem, enrollmentDate);
//   console.log(semesterList);

const generateSemesterList = (
  entryYear,
  courseDuration,
  entryStudyYear = 1,
  sem = 1,
  enrollmentDate = new Date(),
  thresholdMonth = 8 // August, which means academic year changes after this month
) => {
  const semesters = [];
  let currentStartMonth = enrollmentDate.getMonth() + 1; // Enrollment start month (January is 0, so add 1)
  let year =
    currentStartMonth < 7
      ? parseInt(entryYear.split("/")[1])
      : parseInt(entryYear.split("/")[0]); // Extract the first part of the academic year
  let startingSemesterIndex = (parseInt(entryStudyYear) - 1) * 2; // Calculate the index to start from the given study year

  // Adjust starting index based on the provided starting semester
  if (parseInt(sem) === 2) {
    startingSemesterIndex += 1; // Move to the second semester of the starting study year
  }

  let currentYear = year; // Use the provided entry year as the baseline year

  // Generate the list starting from the given study year and semester
  for (let i = startingSemesterIndex; i < courseDuration * 2; i++) {
    let semester = i % 2 === 0 ? 1 : 2; // Alternate between semester 1 and 2

    // Determine if this semester should roll into the next academic year
    let accYear =
      currentStartMonth >= thresholdMonth
        ? `${currentYear}/${currentYear + 1}`
        : `${currentYear - 1}/${currentYear}`;

    semesters.push({
      studyYear: Math.floor(i / 2) + 1, // Study year starts from the given study year
      semester,
      accYear: accYear, // Adjust academic year based on the start month
    });

    // Increment the month by 6 to simulate semester duration
    currentStartMonth += 6;

    // If the currentStartMonth exceeds 12, adjust it and increment the academic year
    if (currentStartMonth > 12) {
      currentStartMonth -= 12;
      currentYear += 1; // Increment the academic year after the second semester
    }
  }

  return semesters;
};

const findDeadSemesters = (
  studentHistory,
  expectedSemesters,
  activeSemester
) => {
  const deadSemesters = [];
  let nextEnrollment = null;

  for (const semester of expectedSemesters) {
    // Check if the semester is missing in the student's history
    const found = studentHistory.find(
      (s) =>
        parseInt(s.sem) === semester.semester &&
        s.acc_yr_title === semester.accYear
    );

    // If not found in history and it comes before or matches the active semester, it's a dead semester
    if (
      !found &&
      (semester.accYear < activeSemester.acc_yr_title ||
        (semester.accYear === activeSemester.acc_yr_title &&
          semester.semester < parseInt(activeSemester.semester)))
    ) {
      deadSemesters.push(semester);
    }

    // console.log("the semester", semester);
    // console.log("active semester", activeSemester);
    // Stop as soon as we reach the active semester
    if (
      semester.accYear === activeSemester.acc_yr_title &&
      semester.semester === parseInt(activeSemester.semester)
    ) {
      // If there are missed semesters, enroll in the first missed one

      nextEnrollment =
        deadSemesters.length > 0
          ? { ...deadSemesters[0], accYear: activeSemester.acc_yr_title }
          : {
              ...activeSemester,
              studyYear: semester.studyYear,
              accYear: activeSemester.acc_yr_title,
            };
      break;
    }
  }

  return {
    deadSemesters,
    nextEnrollment,
  };
};

// Example usage:
// const entryYear = "2022/2023";
// const courseDuration = 3; // 3 years of study
// const studentHistory = [
//   {
//     sem: 1,
//     acc_yr_title: "2022/2023",
//   },
// ]; // New student, no history

// Active semester for August intake
const activeSemester = {
  semester: 1,
  acc_yr_title: "2023/2024",
};

// const expectedSemesters = generateSemesterList(entryYear, courseDuration);
// const { deadSemesters, nextEnrollment } = findDeadSemesters(
//   studentHistory,
//   expectedSemesters,
//   activeSemester
// );

// console.log("Dead Semesters Up To Next Enrollment:", deadSemesters);
// console.log("Next Enrollment:", nextEnrollment);

// Example usage:
// const entryYear = "2025/2026"; // Entry academic year
// const courseDuration = 3; // 3 years of study
// const entryStudyYear = 3; // Start from study year 1
// const sem = 2; // Start from semester 1
// const enrollmentDate = new Date("2024-10-15T19:39:26.000Z"); // Enrollment date for October

// const semesterList = generateSemesterList(
//   entryYear,
//   courseDuration,
//   entryStudyYear,
//   sem,
//   enrollmentDate
// );
// console.log(semesterList);

export {
  findDeadSemesters,
  generateSemesterList,
  generateSemesterListForNormalProgress,
};
