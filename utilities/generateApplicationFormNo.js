// function to generate form numbers with 15 characters

// function generateFormNumber(length = 15) {
//   const characters =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//   let formNumber = "F"; // First character is always 'F'
//   const charactersLength = characters.length;

//   for (let i = 1; i < length; i++) {
//     // Start loop at 1 since first character is already set
//     formNumber += characters.charAt(
//       Math.floor(Math.random() * charactersLength)
//     );
//   }

//   return formNumber.toUpperCase();
// }

function generateFormNumber() {
  const randomLength = 13; // Length for random digits
  const characters = "0123456789";
  let formNumber = "F"; // First character is always 'F'
  const charactersLength = characters.length;

  // Generate 13 random digits
  for (let i = 0; i < randomLength; i++) {
    formNumber += characters.charAt(
      Math.floor(Math.random() * charactersLength)
    );
  }

  // Trim timestamp to fit the total length to 15 characters
  const timestamp = Date.now().toString().slice(-2); // Last 2 digits of the timestamp
  formNumber += timestamp;

  return formNumber;
}
// console.log(generateFormNumber());

export default generateFormNumber;
