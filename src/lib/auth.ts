import { mongodbClient } from "@/lib/db";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt, organization, genericOAuth } from "better-auth/plugins";
import { ObjectId } from "mongodb";
import { sendOrganizationInvitation } from "./mailer";

export const auth = betterAuth({
  database: mongodbAdapter(mongodbClient.getDb()),
  baseURL: "http://localhost:3000",
  trustedOrigins: ["http://localhost:5173","http://localhost:000"],
  secret: process.env.JWT_SECRET!,
  
  advanced: {
    useSecureCookies: false,
    generateId: undefined,
    crossSubDomainCookies: {
      enabled: false
    },
    defaultCookieAttributes: {
      sameSite: "lax"
    }
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
      redirectURI: "http://localhost:3000/api/auth/callback/microsoft",
    },
  },

  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "microsoft"],
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx : any) => {
          console.log("USER CREATE AFTER HOOK HIT");

          await mongodbClient
            .getDb()
            .collection("user")
            .updateOne(
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

      authorizationUrl: "https://accounts.zoho.in/oauth/v2/auth",
      tokenUrl: "https://accounts.zoho.in/oauth/v2/token",

      scopes: ["Aaaserver.profile.READ"],
      userInfoUrl: "https://accounts.zoho.in/oauth/user/info",

      mapProfileToUser: (profile) => {
        console.log("🔍 ZOHO PROFILE RAW:", profile);

        return {
          // REQUIRED: unique ID
          id: String(profile.ZUID ?? profile.id),

          // REQUIRED: email (Zoho uses capital E)
          email: profile.Email?.toLowerCase(),

          // OPTIONAL: display name
          name:
            profile.Display_Name ||
            `${profile.First_Name ?? ""} ${profile.Last_Name ?? ""}`.trim(),

          // OPTIONAL but recommended
          emailVerified: true,
        };
      },
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