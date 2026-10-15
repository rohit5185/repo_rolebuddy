import { Resend } from "resend";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------
// Render (and most cloud hosts) block outbound SMTP (ports 25, 465, 587).
// Resend uses HTTPS — never blocked by any cloud host.
//
// Priority:
//   1. RESEND_API_KEY set → use Resend (production, works on Render)
//   2. EMAIL_HOST + EMAIL_USER + EMAIL_PASS set → use nodemailer SMTP (local dev)
//   3. Neither → log OTP to console (local dev fallback)
// ---------------------------------------------------------------------------

let _resend = null;
let _smtpTransport = null;

function getResendClient() {
  if (_resend) return _resend;
  if (!env.resendApiKey) return null;
  _resend = new Resend(env.resendApiKey);
  return _resend;
}

function getSmtpTransport() {
  if (_smtpTransport) return _smtpTransport;
  if (!env.emailHost || !env.emailUser || !env.emailPass) return null;

  _smtpTransport = nodemailer.createTransport({
    host: env.emailHost,
    port: env.emailPort,
    secure: env.emailPort === 465,
    auth: { user: env.emailUser, pass: env.emailPass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return _smtpTransport;
}

function otpEmailHtml(otp) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9f8fe;border-radius:16px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;width:48px;height:48px;background:#3b2ae1;border-radius:12px;line-height:48px;font-size:22px;color:#fff;">⚡</div>
        <h1 style="margin:12px 0 4px;font-size:22px;font-weight:900;color:#1b1b24;">RoleBuddy</h1>
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#777588;">Peer Accountability Platform</p>
      </div>
      <div style="background:#fff;border-radius:16px;padding:28px 24px;border:1px solid rgba(199,196,217,0.55);">
        <p style="margin:0 0 8px;font-size:14px;color:#464556;">Your one-time login code is:</p>
        <div style="text-align:center;margin:20px 0;">
          <span style="display:inline-block;letter-spacing:0.35em;font-size:40px;font-weight:900;color:#3b2ae1;background:#eeecff;padding:16px 28px;border-radius:12px;">${otp}</span>
        </div>
        <p style="margin:20px 0 0;font-size:12px;color:#777588;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>
      <p style="margin:20px 0 0;text-align:center;font-size:11px;color:#aaa;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;
}

export async function sendOtpEmail(to, otp) {
  const resend = getResendClient();

  // ── Path 1: Resend (HTTPS API — works on Render and all cloud hosts) ──────
  if (resend) {
    const fromAddress = env.resendFromEmail || "RoleBuddy <noreply@rolebuddy.me>";
    logger.info({ to, provider: "resend", from: fromAddress }, "Sending OTP via Resend");

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject: "Your RoleBuddy login code",
      html: otpEmailHtml(otp),
    });

    if (error) {
      logger.error({ err: error, to }, "Resend OTP email failed");
      throw new Error(`Email delivery failed: ${error.message}`);
    }

    logger.info({ to, messageId: data?.id, provider: "resend" }, "OTP email sent successfully");
    return;
  }

  // ── Path 2: Nodemailer SMTP (local dev with SMTP configured) ─────────────
  const smtp = getSmtpTransport();

  if (smtp) {
    logger.info({ to, provider: "smtp", host: env.emailHost }, "Sending OTP via SMTP");
    const info = await smtp.sendMail({
      from: env.emailFrom || `"RoleBuddy" <${env.emailUser}>`,
      to,
      subject: "Your RoleBuddy login code",
      html: otpEmailHtml(otp),
    });
    logger.info({ to, messageId: info.messageId, provider: "smtp" }, "OTP email sent successfully");
    return;
  }

  // ── Path 3: Dev console fallback (no email provider configured) ───────────
  if (env.nodeEnv === "production") {
    logger.error({ to }, "No email provider configured in production — set RESEND_API_KEY");
    throw new Error("Email service is not configured. Please contact support.");
  }

  logger.info({ to, otp, mode: "console" }, "OTP (no provider configured — console fallback for dev)");
}

export async function sendPasswordResetEmail(to, resetLink) {
  const resend = getResendClient();

  if (resend) {
    const fromAddress = env.resendFromEmail || "RoleBuddy <noreply@rolebuddy.me>";
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject: "Reset your RoleBuddy password",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9f8fe;border-radius:16px;">
          <h1 style="font-size:22px;font-weight:900;color:#1b1b24;text-align:center;">Reset your password</h1>
          <p style="color:#464556;font-size:14px;">Click the link below to reset your RoleBuddy password. It expires in 1 hour.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetLink}" style="display:inline-block;background:#3b2ae1;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">Reset Password</a>
          </div>
          <p style="font-size:11px;color:#aaa;text-align:center;">If you did not request this, ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      logger.error({ err: error, to }, "Resend password reset email failed");
      throw new Error(`Email delivery failed: ${error.message}`);
    }

    logger.info({ to, messageId: data?.id }, "Password reset email sent via Resend");
    return;
  }

  const smtp = getSmtpTransport();
  if (smtp) {
    await smtp.sendMail({
      from: env.emailFrom || `"RoleBuddy" <${env.emailUser}>`,
      to,
      subject: "Reset your RoleBuddy password",
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f9f8fe;border-radius:16px;">
          <h1 style="font-size:22px;font-weight:900;color:#1b1b24;text-align:center;">Reset your password</h1>
          <p style="color:#464556;font-size:14px;">Click the link below to reset your RoleBuddy password. It expires in 1 hour.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetLink}" style="display:inline-block;background:#3b2ae1;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">Reset Password</a>
          </div>
          <p style="font-size:11px;color:#aaa;text-align:center;">If you did not request this, ignore this email.</p>
        </div>
      `,
    });
    return;
  }

  logger.info({ to, mode: "dev" }, "Password reset email (no provider configured)");
}
