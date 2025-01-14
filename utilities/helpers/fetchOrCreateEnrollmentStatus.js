import { db } from "../../config/config.js";
import saveData from "../db/saveData.js";

async function fetchOrCreateEnrollmentStatus(statusKey) {
  // Convert the key to a title-case format
  const title = statusKey
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const [results] = await db.execute(
    "SELECT id FROM enrollment_status WHERE deleted = 0 AND title LIKE ?",
    [`%${title}%`]
  );

  if (results.length > 0) {
    return results[0].id;
  }

  // Create the new status if it doesn't exist
  const statusData = {
    title,
    description: `${title} description`, // You can customize this
    color_code: "blue", // Default color code; change as needed
    code: title,
  };

  const save_id = await saveData({
    table: "enrollment_status",
    data: statusData,
    id: null,
  });

  return save_id;
}

export default fetchOrCreateEnrollmentStatus;
