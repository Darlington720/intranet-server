import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";

dayjs.extend(weekday);
dayjs.extend(localizedFormat);

// Function to get the ordinal suffix
const getOrdinalSuffix = (day) => {
  if (day > 3 && day < 21) return "ᵗʰ"; // Covers 11th-20th
  switch (day % 10) {
    case 1:
      return "ˢᵗ";
    case 2:
      return "ⁿᵈ";
    case 3:
      return "ʳᵈ";
    default:
      return "ᵗʰ";
  }
};

// Function to format the date
const formatDateCustom = (dateString) => {
  const date = dayjs(dateString);
  const dayOfWeek = date.format("dddd");
  const day = date.date();
  const month = date.format("MMMM");
  const year = date.format("YYYY");
  const ordinal = getOrdinalSuffix(day);

  return `${dayOfWeek} ${day}${ordinal} ${month}, ${year}`;
};

export default formatDateCustom;
