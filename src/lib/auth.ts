import { mongodbClient } from "@/lib/db";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt, organization } from "better-auth/plugins";
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
}
,
accountLinking: {
    enabled: true,
    trustedProviders: ["google", "microsoft"], // allow auto link if emails match
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
