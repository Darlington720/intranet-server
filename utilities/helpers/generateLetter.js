import path from "path";
import { fileURLToPath } from "url";
import { host, port } from "../../config/config.js";

function formatDate(inputDate) {
  const date = new Date(inputDate);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  // Function to get ordinal suffix in superscript
  const getOrdinalSuffix = (num) => {
    if (num > 3 && num < 21) return num + "<sup>TH</sup>";
    switch (num % 10) {
      case 1:
        return num + "<sup>ST</sup>";
      case 2:
        return num + "<sup>ND</sup>";
      case 3:
        return num + "<sup>RD</sup>";
      default:
        return num + "<sup>TH</sup>";
    }
  };

  return `${getOrdinalSuffix(day)} ${month.toUpperCase()}, ${year}`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function tagsList(roleID = "", admit_card = false) {
  let arrayTags = [
    "{student_number}",
    "{student_name}",
    "{nationality}",
    "{scheme}",
    "{study_session}",
    "{date}",
    "{intake}",
    "{course_duration}",
    "{campus}",
    "{course}",
    "{academic_year}",
    "{academic_year}",
    "{qr_code}",
    "{institute_name}",
    "{institute_email}",
    "{institute_address}",
    "{institute_mobile_no}",
    "{print_date}",
    "{header}",
    "{signature}",
    "{reporting_date}",
    "{registration_start_date}",
    "{registration_end_date}",
    "{lectures_start_date}",
    "{lectures_end_date}",
    "{course_code}",
    "{tuition_fee}",
    "{functional_fees}",
    "{total_fees_amount}",
  ];

  //   if (roleID === 1) {
  //     arrayTags.push(
  //       "{father_name}",
  //       "{mother_name}",
  //       "{student_photo}",
  //       "{register_no}",
  //       "{roll}",
  //       "{admission_date}",
  //       "{class}",
  //       "{section}",
  //       "{category}",
  //       "{caste}"
  //     );
  //   }

  //   if (roleID === 2) {
  //     arrayTags.push(
  //       "{staff_photo}",
  //       "{joining_date}",
  //       "{designation}",
  //       "{department}",
  //       "{qualification}",
  //       "{total_experience}"
  //     );
  //   }

  //   if (admit_card) {
  //     arrayTags.push("{exam_name}", "{subject_list_table}");
  //   } else {
  //     arrayTags.push("{expiry_date}");
  //   }

  return arrayTags;
}

function generateLetter(template, data, admin, examID) {
  let body = template.content;
  const photoSize = template.photo_size;
  const photoStyle = template.photo_style;

  // Fetch tags
  const tags = tagsList(1, true);

  tags.forEach((tag) => {
    const field = tag.replace(/{|}/g, "");

    if (field === "student_photo") {
      const photo = `<img class="" src="public/templates/headers/5654b907874eeb86ad6ac91ad8cee06a.png" width="100%">`;
      body = body.replaceAll(tag, photo);
    } else if (field === "header") {
      const photo = `<img class="hide-header" src="http://${host}:${port}/templates/headers/${data.header}">`;
      body = body.replaceAll(tag, photo);
    } else if (field === "student_number") {
      body = body.replaceAll(tag, data.student_number);
    } else if (field === "print_date") {
      body = body.replaceAll(tag, formatDate(data.date));
    } else if (field === "reporting_date") {
      body = body.replaceAll(tag, data.reporting_date);
    } else if (field === "registration_start_date") {
      body = body.replaceAll(tag, data.registration_start_date);
    } else if (field === "registration_end_date") {
      body = body.replaceAll(tag, data.registration_end_date);
    } else if (field === "lectures_start_date") {
      body = body.replaceAll(tag, data.lectures_start_date);
    } else if (field === "lectures_end_date") {
      body = body.replaceAll(tag, data.lectures_end_date);
    } else if (field === "student_name") {
      body = body.replaceAll(tag, data.student_name);
    } else if (field === "nationality") {
      body = body.replaceAll(tag, data.nationality);
    } else if (field === "scheme") {
      body = body.replaceAll(tag, data.scheme);
    } else if (field === "study_session") {
      body = body.replaceAll(tag, data.study_session);
    } else if (field === "intake") {
      body = body.replaceAll(tag, data.intake);
    } else if (field === "course_duration") {
      body = body.replaceAll(tag, data.course_duration);
    } else if (field === "campus") {
      body = body.replaceAll(tag, data.campus);
    } else if (field === "course") {
      body = body.replaceAll(tag, data.course);
    } else if (field === "course_code") {
      body = body.replaceAll(tag, data.course_code);
    } else if (field === "tuition_fee") {
      body = body.replaceAll(tag, data.tuition_fee);
    } else if (field === "functional_fees") {
      body = body.replaceAll(tag, data.functional_fees);
    } else if (field === "total_fees_amount") {
      body = body.replaceAll(tag, data.total_fees_amount);
    } else if (field === "academic_year") {
      body = body.replaceAll(tag, data.academic_year);
    } else if (field === "subject_list_table") {
      body = body.replaceAll(
        tag,
        tableHtml(exam_id, data.class_id, data.section_id, data.branch_id)
      );
    } else if (field === "logo" && template.logo) {
      const logo_ph = `<img src="${baseUrl(
        "uploads/certificate/" + template.logo
      )}">`;
      body = body.replaceAll(tag, logo_ph);
    } else if (field === "signature" && template.signature) {
      const signature_ph = `
      <div style="display: flex; justify-content: center; align-items: center;">
      <img src="http://${host}:${port}/templates/signatures/${data.signature}" width="15%">
      </div>`;
      body = body.replaceAll(tag, signature_ph);
    } else if (field === "qr_code" && template.qr_code) {
      const qr_code = template.qr_code;
      const params = {
        savename: `uploads/qr_code/stu_${data.id}.png`,
        level: "M",
        size: 2,
        data: `${qr_code.charAt(0).toUpperCase() + qr_code.slice(1)} - ${
          data[qr_code]
        }`,
      };
      const qrCode = generateQrCode(params);
      const qrImage = `<img src="${baseUrl(qrCode)}">`;
      body = body.replaceAll(tag, qrImage);
    } else if (field === "present_address") {
      body = body.replaceAll(tag, data.current_address);
    }
    // else if (field === "print_date") {
    //   body = body.replaceAll(tag, new Date(print_date).toLocaleDateString());
    // }
    else {
      body = body.replaceAll(tag, data[field] || "");
    }
  });

  return body;
}

export default generateLetter;
