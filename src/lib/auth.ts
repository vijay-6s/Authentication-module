import { mongodbClient } from "@/lib/db";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { jwt } from "better-auth/plugins";
import { ObjectId } from "mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(mongodbClient.getDb()),
  baseURL: "http://localhost:3000",
  trustedOrigins: ["http://localhost:5173"],

  emailAndPassword: { enabled: true },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: "http://localhost:3000/api/auth/callback/google",
    },
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
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          sub: user.id,
          email: user.email,
          role: user.role, // ✅ custom field
        }),
        expirationTime: "15m",
      },
    }),
  ],
});
