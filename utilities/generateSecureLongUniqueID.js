import { v4 as uuidv4 } from "uuid";

function generateUniqueID() {
  const firstUUID = uuidv4(); // Generate first UUID
  const secondUUID = uuidv4(); // Generate second UUID
  const thirdUUID = uuidv4(); // Generate third UUID
  const fourthUUID = uuidv4(); // Generate fourth UUID

  return `${firstUUID}-${secondUUID}`;
}

// Example usage:
const uniqueID = generateUniqueID();
console.log(uniqueID);
