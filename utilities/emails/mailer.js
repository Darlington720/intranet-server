import { GraphQLError } from "graphql";
import nodemailer from "nodemailer";

async function sendEmail({ to, subject, message }) {
  try {
    // Create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: "darlingtonakampa720@gmail.com", // your email
        pass: "bgnquzdlbfnvoeqj", // your generated app password
      },
    });

    console.log("Sending mail...");

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Performance Management System" <darlingtonakampa720@gmail.com>', // Sender name and email
      to: to, // List of receivers
      subject: subject, // Subject line
      html: message, // HTML-formatted message body
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error while sending email:", error.message);
    throw new GraphQLError("Server error: Failed to send emails");
  }
}

export default sendEmail;
