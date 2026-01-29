// src/lib/mailer.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASSWORD!, // App password
  },
  secure: true,
  port: 465,
});

export async function sendOrganizationInvitation({
  email,
  teamName,
  invitedBy,
  inviteLink,
}: {
  email: string;
  teamName: string;
  invitedBy: string;
  inviteLink: string;
}) {
  console.log("📨 Sending org invite email");
  console.log("To:", email);
  console.log("Team:", teamName);
  console.log("By:", invitedBy);
  console.log("Link:", inviteLink);

  await transporter.sendMail({
    from: process.env.EMAIL_USER!,
    to: email,
    subject: `You're invited to ${teamName}`,
    html: `
      <h2>Welcome to ${teamName}</h2>
      <p>You were invited by <strong>${invitedBy}</strong> to join this organization.</p>
      <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #111827; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 16px;">
        Accept Invitation
      </a>
      <p style="color: #666; margin-top: 24px;">If the button doesn't work, copy and paste this link:</p>
      <p style="color: #666;">${inviteLink}</p>
    `,
  });

  console.log("✅ Email sent successfully");
}

export async function sendMagicLinkEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  console.log("📨 Sending magic link email");
  console.log("To:", email);
  console.log("Link:", url);

  await transporter.sendMail({
    from: process.env.EMAIL_USER!,
    to: email,
    subject: "Sign in to your account",
    html: `
      <h2>Sign in with Magic Link</h2>
      <p>Click the button below to sign in to your account:</p>
      <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #111827; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 16px;">
        Sign In
      </a>
      <p style="color: #666; margin-top: 24px;">If the button doesn't work, copy and paste this link:</p>
      <p style="color: #666;">${url}</p>
      <p style="color: #999; margin-top: 24px; font-size: 12px;">This link will expire in 15 minutes.</p>
    `,
  });

  console.log("✅ Magic link email sent successfully");
}

