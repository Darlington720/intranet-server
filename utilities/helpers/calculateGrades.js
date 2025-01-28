function calculateGrades(records, entry_acc_yr) {
  // Parse the starting academic year
  let startYear1;
  let startYear2;
  if (entry_acc_yr) {
    const [s1, s2] = entry_acc_yr.split("/").map(Number);
    startYear1 = s1;
    startYear2 = s2;
  }

  // Helper to calculate acc_yr
  const calculateAcademicYear = (studyYr, semester) => {
    const yearOffset = studyYr - 1 + Math.floor((semester - 1) / 2);
    const accYearStart = startYear1 + yearOffset;
    const accYearEnd = startYear2 + yearOffset;
    return `${accYearStart}/${accYearEnd}`;
  };

  // Group records by study_yr and semester
  const grouped = records.reduce((acc, record) => {
    const groupKey = `${record.study_yr}${record.semester}`;
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(record);
    return acc;
  }, {});

  let cumulativeCreditUnits = 0;
  let cumulativeWeightedScore = 0;

  // Process each group
  const results = [];
  for (const [groupKey, groupRecords] of Object.entries(grouped)) {
    const semesterCreditUnits = groupRecords.reduce(
      (sum, rec) => sum + parseFloat(rec.credit_units),
      0
    );

    // console.log("groupRecords", groupRecords);

    const semesterWeightedScore = groupRecords.reduce(
      (sum, rec) =>
        sum + parseFloat(rec.grade_point) * parseFloat(rec.credit_units),
      0
    );

    // GPA for this group
    const GPA = semesterWeightedScore / semesterCreditUnits;
    // console.log("semesterWeightedScore", {
    //   semesterWeightedScore,
    //   semesterCreditUnits,
    // });
    // console.log("gpa", GPA);

    // Update cumulative values
    cumulativeCreditUnits += semesterCreditUnits;
    cumulativeWeightedScore += semesterWeightedScore;

    // Calculate acc_yr for this group
    const { study_yr, semester } = groupRecords[0];
    const acc_yr = calculateAcademicYear(
      parseInt(study_yr),
      parseInt(semester)
    );

    // Append computed values to each record in the group
    groupRecords.forEach((record) => {
      results.push({
        ...record,
        exam: record.exam ? parseFloat(record.exam.toFixed(1)) : record.exam, // Round to 1 decimal place
        final_mark: record.final_mark
          ? Math.round(record.final_mark)
          : record.final_mark,
        yrsem: groupKey,
        TCU: semesterCreditUnits,
        CTWS: cumulativeWeightedScore,
        CTCU: cumulativeCreditUnits,
        GPA: GPA.toFixed(2),
        CGPA: (cumulativeWeightedScore / cumulativeCreditUnits).toFixed(2),
        acc_yr_title: entry_acc_yr ? acc_yr : record.acc_yr_title, // Add calculated academic year
        remarks:
          record.grade == "F" ? "RTK" : record.remarks ? record.remarks : "NP",
      });
    });
  }

  return results;
}

export default calculateGrades;
