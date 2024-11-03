// const resolveSemesterStatus = (academicSchedules) => {
//   const currentTimestamp = Date.now(); // Get the current time in milliseconds

//   return academicSchedules.map((schedule) => {
//     const startDate = parseInt(schedule.start_date); // Convert the start date to an integer
//     const endDate = parseInt(schedule.end_date); // Convert the end date to an integer

//     let status;
//     if (currentTimestamp < startDate) {
//       status = "Not Started";
//     } else if (currentTimestamp >= startDate && currentTimestamp <= endDate) {
//       status = "Running";
//     } else if (currentTimestamp > endDate) {
//       status = "Ended";
//     }

//     // Return a new object with the existing schedule data and the status
//     return {
//       ...schedule,
//       status,
//     };
//   });
// };

// const resolveSemesterStatus = (semesterData) => {
//   const currentTimestamp = Date.now(); // Get the current time in milliseconds

//   return semesterData.map((semester) => {
//     const startDate = new Date(semester.start_date).getTime(); // Convert start date to timestamp
//     const endDate = new Date(semester.end_date).getTime(); // Convert end date to timestamp

//     let status;
//     if (currentTimestamp < startDate) {
//       status = "Not Started";
//     } else if (currentTimestamp >= startDate && currentTimestamp <= endDate) {
//       status = "Running";
//     } else if (currentTimestamp > endDate) {
//       status = "Ended";
//     }

//     // Add the status field to the original object
//     return {
//       ...semester,
//       status,
//     };
//   });
// };

const resolveSemesterStatus = (semesterData) => {
  const currentTimestamp = Date.now(); // Get the current time in milliseconds

  return semesterData.map((semester) => {
    const startDate = new Date(semester.start_date).getTime(); // Convert start date to timestamp

    // Create a date object for the end date and set it to the end of the day (23:59:59)
    const endDate = new Date(semester.end_date);
    endDate.setHours(23, 59, 59, 999); // Set to end of the day
    const endDateTimestamp = endDate.getTime(); // Convert end date to timestamp

    let status;
    if (currentTimestamp < startDate) {
      status = "Not Started";
    } else if (
      currentTimestamp >= startDate &&
      currentTimestamp <= endDateTimestamp
    ) {
      status = "Running";
    } else if (currentTimestamp > endDateTimestamp) {
      status = "Ended";
    }

    // Return a new object with the existing semester data and the status
    return {
      ...semester,
      status,
    };
  });
};

export default resolveSemesterStatus;
