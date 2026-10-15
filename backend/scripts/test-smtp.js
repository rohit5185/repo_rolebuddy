/**
 * Quick SMTP smoke test — run this to verify your Gmail App Password works.
 * Usage: node scripts/test-smtp.js <your-test-email@gmail.com>
 *
 * If this succeeds, OTP email delivery will work in the app.
 * If this fails, fix your EMAIL_PASS / EMAIL_USER in backend/.env first.
 */

import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const {
  EMAIL_HOST = "smtp.gmail.com",
  EMAIL_PORT = "587",
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM
} = process.env;

const to = process.argv[2] || EMAIL_USER;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error("❌  EMAIL_USER or EMAIL_PASS is not set in backend/.env");
  process.exit(1);
}

console.log("📧  Testing SMTP connection...");
console.log(`   Host  : ${EMAIL_HOST}:${EMAIL_PORT}`);
console.log(`   User  : ${EMAIL_USER}`);
console.log(`   From  : ${EMAIL_FROM || EMAIL_USER}`);
console.log(`   To    : ${to}`);
console.log();

const transport = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT),
  secure: Number(EMAIL_PORT) === 465,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

try {
  await transport.verify();
  console.log("✅  SMTP connection verified!\n");

  const info = await transport.sendMail({
    from: EMAIL_FROM || `"RoleBuddy" <${EMAIL_USER}>`,
    to,
    subject: "RoleBuddy — SMTP test",
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;background:#f9f8fe;border-radius:12px;max-width:480px;">
        <h2 style="color:#3b2ae1;">✅ SMTP Test Passed</h2>
        <p>This is a test email from your local RoleBuddy dev environment.</p>
        <p style="font-size:32px;font-weight:900;letter-spacing:0.3em;color:#3b2ae1;text-align:center;background:#eeecff;padding:16px;border-radius:8px;">123456</p>
        <p style="font-size:12px;color:#aaa;">If you see this, OTP emails will work correctly.</p>
      </div>
    `
  });

  console.log("✅  Test email sent successfully!");
  console.log(`   Message ID: ${info.messageId}`);
  console.log(`   Accepted  : ${info.accepted.join(", ")}`);
  console.log(`\n🎉  OTP email delivery is working. Check your inbox at: ${to}`);
} catch (err) {
  console.error("❌  SMTP error:");
  console.error(`   ${err.message}`);
  console.error();

  if (err.code === "EAUTH") {
    console.error("🔑  Authentication failed. Fix:");
    console.error("   1. Go to https://myaccount.google.com/apppasswords");
    console.error("   2. Make sure 2FA is ON for your Gmail account");
    console.error("   3. Delete old app password → generate a new one");
    console.error("   4. Update EMAIL_PASS in backend/.env with the new 16-char password");
    console.error("   5. Make sure there are NO spaces in the app password");
  } else if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
    console.error("🌐  Network error. Fix:");
    console.error("   - Check your internet connection");
    console.error("   - Check EMAIL_HOST and EMAIL_PORT in backend/.env");
    console.error("   - EMAIL_HOST should be: smtp.gmail.com");
    console.error("   - EMAIL_PORT should be: 587");
  } else if (err.responseCode === 535) {
    console.error("🔑  535 Authentication credentials invalid.");
    console.error("   → The app password was likely revoked. Generate a new one at:");
    console.error("     https://myaccount.google.com/apppasswords");
  }

  process.exit(1);
}
