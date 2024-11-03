function checkSchemeStatus(start_date, end_date) {
  const currentDate = Date.now(); // Get the current timestamp

  if (currentDate >= start_date && currentDate <= end_date) {
    return "running";
  } else {
    return "stopped";
  }
}

const getRunningAdmissions = (admissions) => {
  const currentDate = Date.now(); // Get the current timestamp

  let x = admissions.filter((admission) => {
    const startDate = Date.parse(admission.start_date); // converting to timestamp
    const endDate = Date.parse(admission.end_date);

    // console.log("startdate", startDate);

    return currentDate >= startDate && currentDate <= endDate;
  });

  // console.log("jkhshjsj", x);
  return x;
};

export default getRunningAdmissions;
