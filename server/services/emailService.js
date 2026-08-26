/**
 * Abstract Email Service
 * Logs emails to console in development mode, or sends them via SMTP if configured.
 */
import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log(`\n📧 [EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    console.log(`Body:\n${html.replace(/<[^>]*>?/gm, '')}\n`); // Strip basic HTML for logs
    return true;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"All-in-One Store" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};
