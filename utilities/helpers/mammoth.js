import mammoth from "mammoth";

mammoth
  .convertToHtml({
    path: "public/templates/admission_letters/6620f8938b70043494969a8efd1781e2.docx",
  })
  .then(function (result) {
    var html = result.value; // The generated HTML
    var messages = result.messages; // Any messages, such as warnings during conversion
  })
  .catch(function (error) {
    console.error(error);
  });
