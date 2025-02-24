import fs from "fs";
import path from "path";
import libre from "libreoffice-convert";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import mammoth from "mammoth";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const convertDocxToPdf = (docxBuffer) => {
  return new Promise((resolve, reject) => {
    libre.convert(docxBuffer, ".pdf", undefined, (err, pdfBuffer) => {
      if (err) return reject(err);
      resolve(pdfBuffer.toString("base64"));
    });
  });
};

async function convertDocxToHtml(docxBuffer) {
  const result = await mammoth.convertToHtml({ buffer: docxBuffer });
  return result.value; // HTML content
}

async function generatePdfFromHtml(htmlContent, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the HTML content
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  // Generate PDF
  await page.pdf({ path: outputPath, format: "A4" });

  await browser.close();
}

const generateAdmissionLetter = async (templatePath, data) => {
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Replace placeholders
  doc.render(data);

  // // Generate file in memory
  const buffer = doc.getZip().generate({ type: "nodebuffer" });

  const pdfBuffer = await convertDocxToPdf(buffer);

  // // Generate DOCX file in memory
  // const docxBuffer = doc.getZip().generate({ type: "nodebuffer" });

  // // Convert to base64 for GraphQL response
  return pdfBuffer.toString("base64");
};

export default generateAdmissionLetter;

// generateAdmissionLetter(
//   "public/templates/admission_letters/6620f8938b70043494969a8efd1781e2.docx"
// );
