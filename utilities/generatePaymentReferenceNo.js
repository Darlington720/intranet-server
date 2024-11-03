// function to generate paymeent reference numbers
function generateRefNo() {
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let refNo = "";

  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    refNo += characters[randomIndex];
  }

  return refNo;
}

export default generateRefNo;
