import path from "path";
import fs from "fs";

const findImageWithExtension = (stdno, folderPath) => {
  const validExtensions = ["jpg", "jpeg", "png", "gif"];
  for (let ext of validExtensions) {
    const filePath = path.join(folderPath, `${stdno}.${ext}`);
    if (fs.existsSync(filePath)) {
      return `${stdno}.${ext}`;
    }
  }
  return null;
};

export default findImageWithExtension;
