import crypto from "crypto";

const generateRandomString = (length) => {
  return crypto.randomBytes(length).toString("hex"); // Generates a random string
};

const generateEnrollmentToken = () => {
  return `E${generateRandomString(9)}`.toUpperCase(); // e.g., "ENROLL-9fbd1234fabc"
};

const studentToken = generateEnrollmentToken();
// console.log(studentToken.toUpperCase());

export default generateEnrollmentToken;
