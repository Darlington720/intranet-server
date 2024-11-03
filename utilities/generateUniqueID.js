import { v4 as uuidv4 } from "uuid";

function generateUniqueID() {
  const uuid = uuidv4(); // Generate UUID
  const timestamp = Date.now(); // Get current timestamp in milliseconds
  return `${uuid}-${timestamp}`;
}

// Example usage:
// const uniqueID = generateUniqueID();
// console.log(uniqueID);

export default generateUniqueID;
