// lib/auth.ts
import { mongodbClient } from "@/lib/db";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt, organization } from "better-auth/plugins";
import { ObjectId } from "mongodb";
import { sendOrganizationInvitation } from "./mailer";
import { genericOAuth } from "better-auth/plugins";
export const auth = betterAuth({
  database: mongodbAdapter(mongodbClient.getDb()),
  baseURL: "http://localhost:3000",
  trustedOrigins: ["http://localhost:5173"],
  secret: process.env.JWT_SECRET!,

  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: { sameSite: "lax" },
  },
  cookies: {
    sessionToken: {
      name: "better-auth.session_token",
      options: {
        httpOnly: true,
        sameSite: "lax", // ✅ required for redirects
        secure: false,   // true only in HTTPS
        path: "/",
      },
    },
  },

  emailAndPassword: { enabled: true },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: "common",
    },
  },

  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "microsoft"],
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user : any , ctx: any) => {
          await mongodbClient.getDb().collection("user").updateOne(
            { _id: new ObjectId(user.id) },
            {
              $set: {
                role: "user",
                onboardingCompleted: false,
                provider: ctx.context?.oauth?.providerId ?? "password",
              },
            }
          );
        },
      },
    },
  },

  plugins: [
    jwt(),
    genericOAuth({
  config: [
    {
      providerId: "zoho",
      clientId: process.env.ZOHO_CLIENT_ID!,
      clientSecret: process.env.ZOHO_CLIENT_SECRET!,
      authorizationUrl: "https://accounts.zoho.com/oauth/v2/auth",
      tokenUrl: "http://localhost:3000/auth/zoho/token",
      userInfoUrl: "http://localhost:3000/auth/zoho/userinfo",
       scopes: ["Aaaserver.profile.READ"],

    },
  ],
}),
    organization({
      async sendInvitationEmail(data) {
        const inviteLink = `http://localhost:5173/accept-invitation/${data.id}`;
        await sendOrganizationInvitation({
          email: data.email,
          teamName: data.organization.name,
          invitedBy: data.inviter.user.email,
          inviteLink,
        });
      },
    }),
  ],
});
