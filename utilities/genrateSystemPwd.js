// the generateRandomString function creates a string of 5 characters randomly chosen
// from the set of uppercase letters and numbers. The prefix 'NKU' is then appended to the
//  generated string. Adjust the length or character set as needed to meet your specific requirements.

function generateRandomString() {
  const prefix = "NKU";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomString = Array.from({ length: 5 }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");

  return `${prefix}${randomString}`;
}

export default generateRandomString;
