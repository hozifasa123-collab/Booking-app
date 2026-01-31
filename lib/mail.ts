import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // إيميلك الجيميل
        pass: process.env.EMAIL_PASS, // كود الـ 16 حرف اللي جبناه
      },
    });

    const info = await transporter.sendMail({
      from: `"Booking App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Nodemailer Error:", error);
    return null;
  }
};