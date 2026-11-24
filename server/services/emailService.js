import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

if (env.EMAIL_USER && env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
}

export async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    console.log(`[EMAIL DEV MOCK] To: ${to} | Subject: ${subject}`);
    if (text) console.log(`[EMAIL BODY]: ${text}`);
    return { mock: true };
  }

  return transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
