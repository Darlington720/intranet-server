import fs from "fs";
import docxPdf from "docx-pdf";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const convertDocxToPdf = async (docxBuffer) => {
  return new Promise((resolve, reject) => {
    const inputPath = path.join(__dirname, "temp.docx");
    const outputPath = path.join(__dirname, "temp.pdf");

    fs.writeFileSync(inputPath, docxBuffer);

    docxPdf(inputPath, outputPath, (err) => {
      if (err) return reject(err);

      const pdfBuffer = fs.readFileSync(outputPath);
      resolve(pdfBuffer);

      // Clean up temporary files
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });
};

export default convertDocxToPdf;
