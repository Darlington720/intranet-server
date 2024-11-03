import nodemailer from "nodemailer";

async function sendEmail(to, otp) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "darlingtonakampa720@gmail.com",
      pass: "bgnquzdlbfnvoeqj",
    },
  });

  console.log("Sending mail");

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: "darlingtonakampa720@gmail.com", // sender address
    to: to, // list of receivers
    subject: "OTP for login", // Subject line
    text: `Your OTP is: ${otp}`, // plain text body
  });

  console.log("Message sent: %s", info.messageId);
}

// sendEmail('dakampereza.std@nkumbauniversity.ac.ug', '123456');
export default sendEmail;
