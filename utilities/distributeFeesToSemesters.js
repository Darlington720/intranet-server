async function distributeFees(courseDuration, fees, numOfSemestersPerYear) {
  const totalSemesters = courseDuration * numOfSemestersPerYear;

  // Create an array to store fee objects for each semester
  const distributedFees = [];

  // Distribute the fee across semesters
  for (let semester = 1; semester <= totalSemesters; semester++) {
    const year = Math.ceil(semester / numOfSemestersPerYear); // Calculate the year
    const semesterInYear =
      semester % numOfSemestersPerYear || numOfSemestersPerYear; // Calculate the semester within the year

    // Iterate over each fee object
    fees.forEach((fee) => {
      // console.log("fee", fee);
      // eg accomodation
      // if (fee.category_name.toLowerCase() == "other") {
      //   fee.frequency_code = "everySemester";
      // }
      if (!fee.frequency_code) {
        fee.frequency_code = "everySemester";
      }
      // Determine the frequency code for the current semester
      let distributeFee = false;
      switch (fee.frequency_code) {
        case "everySemester":
          distributeFee = true;
          break;
        case "everySecondSemester":
          distributeFee = semester % 2 === 0; // Distribute every second semester
          break;
        case "firstYearFirstSemester":
          distributeFee = semester === 1; // Distribute only in the first semester of the first year
          break;
        // Add more cases for other frequency codes if needed
      }

      // If the fee should be distributed for the current semester, add it to distributedFees
      if (distributeFee) {
        // const distributedAmount = fee.amount / totalSemesters;
        distributedFees.push({
          item_id: fee.item_id,
          item_code: fee.item_code,
          item_name: fee.item_name,
          amount: fee.amount,
          frequency_code: fee.frequency_code,
          category_id: fee.category_id,
          item_description: fee.item_description,
          // applies_to_all: fee.applies_to_all,
          mandatory: fee.mandatory,
          study_yr: year,
          semester: semesterInYear,
        });
      }
    });
  }

  return distributedFees;
}

const courseDuration = 3; // Duration of the course in years

const _fees = [
  {
    item_code: "30001",
    item_name: "LIBRARY FEES",
    amount: "5000",
    category: {
      id: "2",
      category_name: "FUNCTIONAL",
    },
    frequency_code: "everySemester",
    mandatory: 1,
  },
  {
    item_code: "60003",
    item_name: "GUILD FEE",
    amount: "25000",
    category: {
      id: "2",
      category_name: "FUNCTIONAL",
    },
    frequency_code: "everySemester",
    mandatory: 1,
  },
  {
    item_code: "600032",
    item_name: "RESEARCH FEE",
    amount: "40000",
    category: {
      id: "2",
      category_name: "FUNCTIONAL",
    },
    frequency_code: "firstYearFirstSemester",
    mandatory: 1,
  },
];
const numOfSemestersPerYear = 2; // Assuming there are two semesters per year

// distributeFees(courseDuration, _fees, numOfSemestersPerYear)
//   .then((distributedFees) => {
//     console.log("Distributed fees:", distributedFees);
//   })
//   .catch((err) => {
//     console.error("Error distributing fees:", err);
//   });

export default distributeFees;
