import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { fileURLToPath } from "url";

const generateAdmissionLetter = (templatePath) => {
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Replace placeholders
  doc.render({
    student_number: "2000101041",
    student_name: "AKAMPA DARL",
    nationality: "UGANDAN",
    scheme: "DIRECT ENTRY",
    study_session: "DAY",
    date: "2024-08-09",
    intake: "MAY",
    course_duration: "3 YEARS",
    campus: "MAIN",
    course: "BCS",
    academic_year: "2023/2024",
    reporting_date: "2025-03-05",
    registration_date: "2025-03-05",
    lectures_start_date: "2025-03-05",
    lectures_end_date: "2025-03-05",
    fees_per_semester: "3 M",
  });

  const outputPath = path.join(__dirname, `200101041-admission-letter.docx`);
  fs.writeFileSync(outputPath, doc.getZip().generate({ type: "nodebuffer" }));

  return outputPath;
};

generateAdmissionLetter(
  "public/templates/admission_letters/admission_template.docx"
);
