import crypto from "crypto";

const _generateRegistrationToken = (length) => {
  return crypto.randomBytes(length).toString("hex"); // Generates a random string
};

const generateRegistrationToken = () => {
  return `REG${_generateRegistrationToken(9)}`.toUpperCase(); // e.g., "REG9fbd1234fabc"
};

export default generateRegistrationToken;
