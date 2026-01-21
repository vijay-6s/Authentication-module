// src/lib/mailer.ts
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
  console.log("📨 Org invite email");
  console.log("To:", email);
  console.log("Team:", teamName);
  console.log("By:", invitedBy);
  console.log("Link:", inviteLink);

  // Replace with SendGrid / SES / Resend / Postmark later
}
