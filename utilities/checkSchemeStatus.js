import { getApplicationForms } from "../schema/application/resolvers.js";

function checkSchemeStatus(start_date, end_date) {
  const currentDate = Date.now(); // Get the current timestamp

  if (currentDate >= start_date && currentDate <= end_date) {
    return "running";
  } else {
    return "stopped";
  }
}

const getRunningAdmissions = async (admissions, applicant_id) => {
  const currentDate = Date.now(); // Get the current timestamp

  const admissionsWithForms = await Promise.all(
    admissions.map(async (admission) => {
      const startDate = Date.parse(admission.start_date);
      const endDate = Date.parse(admission.end_date);

      if (currentDate >= startDate && currentDate <= endDate) {
        const [application] = await getApplicationForms({
          applicant_id,
          admissions_id: admission.id,
        });

        return { ...admission, form_no: application?.form_no || null };
      }
      return null; // Filter out items that don't match
    })
  );

  // Remove `null` values from the result
  return admissionsWithForms.filter((admission) => admission !== null);
};

export default getRunningAdmissions;
