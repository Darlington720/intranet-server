import crypto from "crypto";

const generateRandomString = (length) => {
  return crypto.randomBytes(length).toString("hex"); // Generates a random string
};

const generateDeadSemToken = () => {
  return `DEAD${generateRandomString(6)}`.toUpperCase(); // e.g., "DEAL-9fbd1234fabc"
};

// console.log(studentToken.toUpperCase());

export default generateDeadSemToken;
