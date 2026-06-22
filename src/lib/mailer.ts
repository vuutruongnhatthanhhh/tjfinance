import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_OAUTH_USER!;

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"TJFinance" <${GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
