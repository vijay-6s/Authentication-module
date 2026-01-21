import express from "express";
import cors from "cors";
import { mongodbClient } from "@/lib/db";
import { auth } from "@/lib/auth";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import nodemailer from "nodemailer";
import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";

/* -------------------- Types -------------------- */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: "vijaymano0501@gmail.com", // your email
        pass: "gmgv utjt tupv hmqp" // the app password you generated, paste without spaces
    },
    secure: true,
    port: 465
});

const app = express();

/* -------------------- CORS -------------------- */
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- Better Auth -------------------- */
app.use("/api/auth", toNodeHandler(auth));

/* -------------------- JWKS JWT -------------------- */
const JWKS = createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
);

const requireJwt = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: "http://localhost:3000",
      audience: "http://localhost:3000",
    });

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

/* -------------------- Mailer -------------------- */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  console.log("📨 EMAIL");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log(html);
}

/* -------------------- Create Organization -------------------- */
app.post("/organization/create", async (req, res) => {
  console.log(res);
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email required" });
    }

    // Must be logged in
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
 const result = await mongodbClient
  .getCollection("user")
  .insertOne({
    email: email,
    role: "admin",
    createdAt: new Date(),
  })

const userID : string = String(result.insertedId)

console.log("Inserted user id:", userID);

(async () => {
  await transporter.sendMail({
  from: "vijaymano0501@gmail.com", // your email
  to: email, // the email address you want to send an email to
  subject: `You're invited to ${name}`, // The title or subject of the email
  html: `
    <h2>${name}</h2>
    <p>You were invited to join this organization.</p>
    <a href="http://localhost:5173">Accept Invitation</a>
  ` // I like sending my email as html, you can send \
           // emails as html or as plain text
});

console.log("Email sent");
})();
    const slug =
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") +
      "-" +
      Date.now().toString().slice(-4);

    // 1️⃣ Create org
    const org = await auth.api.createOrganization({
      body: { name, slug },
      headers: fromNodeHeaders(req.headers),
    });

    const orgId = org?.id;

const data = await auth.api.addMember({
    body: {
        userId: userID,
        role: ["admin"], // required
        organizationId: orgId,
    },
});


    // 3️⃣ Send email
    await sendEmail({
      to: email,
      subject: `You're invited to ${name}`,
      html: `
        <h2>${name}</h2>
        <p>You were invited to join this organization.</p>
        <a href="http://localhost:5173">Accept Invitation</a>
      `,
    });

    res.json({
      success: true,
      organizationId: orgId,
    });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

/* -------------------- Protected API -------------------- */
app.get("/api/protected", requireJwt, (req, res) => {
  res.json({
    user: req.user,
  });
});

/* -------------------- Session -------------------- */
app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

/* -------------------- Root -------------------- */
app.get("/", (_req, res) => {
  res.json({ status: "OK – Better Auth + Organizations running" });
});

export default app;
