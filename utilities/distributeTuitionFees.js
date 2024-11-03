async function distributeTuitionFees(
  courseDuration,
  tuitionFeesPerYear,
  numOfSemestersPerYear
) {
  const distributedFees = [];

  for (let year = 1; year <= courseDuration; year++) {
    // Get the tuition fee for the current year
    const tuitionFee = tuitionFeesPerYear.find(
      (fee) => parseInt(fee.study_yr) === year
    );

    if (!tuitionFee) {
      //   distributedFees.push(null);
      //   console.warn(`No tuition fee found for year ${year}`);
      continue;
    }

    for (let semester = 1; semester <= numOfSemestersPerYear; semester++) {
      distributedFees.push({
        item_id: tuitionFee.item_id,
        item_code: tuitionFee.item_code,
        item_name: tuitionFee.item_name,
        amount: tuitionFee.amount,
        mandatory: tuitionFee.mandatory,
        frequency_code: tuitionFee.frequency_code,
        item_description: tuitionFee.item_description,
        category_id: tuitionFee.category_id,
        study_yr: year,
        semester: semester,
      });
    }
  }

  return distributedFees;
}

const courseDuration = 3; // Duration of the course in years
const numOfSemestersPerYear = 2; // Assuming there are two semesters per year

// Tuition fees per year
const tuitionFeesPerYear = [
  {
    id: 1,
    study_yr: "1",
    nationality_category_id: "1",
    study_time_id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
    item_id: "1",
    amount: "1299990",
    frequency_code: "everySemester",
    item_code: "3000",
    item_name: "TUITION",
    mandatory: 1,
    category_id: "1",
  },
  {
    id: 5,
    study_yr: "2",
    nationality_category_id: "1",
    study_time_id: "ef8ddf6b-c98d-489b-a071-e1feb034d07c-1718204849940",
    item_id: "1",
    amount: "1000000",
    frequency_code: "everySemester",
    item_code: "3000",
    item_name: "TUITION",
    mandatory: 1,
    category_id: "1",
  },
];

// // Distribute the tuition fees across semesters for each year
// distributeTuitionFees(courseDuration, tuitionFeesPerYear, numOfSemestersPerYear)
//   .then((distributedTuitionFees) => {
//     console.log("Distributed tuition fees:", distributedTuitionFees);
//   })
//   .catch((err) => {
//     console.error("Error distributing tuition fees:", err);
//   });

export default distributeTuitionFees;
