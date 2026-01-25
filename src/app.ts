import express from "express";
import cors from "cors";
import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";
import { auth } from "@/lib/auth";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";

/* -------------------- Types -------------------- */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const app = express();

/* ======================================================================
   Zoho DC Store (keyed by OAuth state)
   ====================================================================== */
const zohoDcStore = new Map<
  string,
  { accountsServer: string; location?: string }
>();

/* -------------------- CORS -------------------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ======================================================================
   Better Auth (MUST be mounted before custom routes that depend on it)
   ====================================================================== */
/* -------------------- Better Auth with Zoho DC interception -------------------- */
const betterAuthHandler = toNodeHandler(auth);

app.use("/api/auth", (req, res) => {
  if (
    req.method === "GET" &&
    req.path === "/oauth2/callback/zoho"
  ) {
    const {
      code,
      location,
      "accounts-server": accountsServer,
    } = req.query as Record<string, string>;

    if (code && accountsServer) {
      zohoDcStore.set(code, { accountsServer, location });
      console.log(
        "Stored Zoho DC info BY CODE:",
        code,
        accountsServer,
        location
      );
    }
  }

  betterAuthHandler(req, res);
});



/* ====================== ZOHO INTERCEPTOR ROUTES ====================== */


app.post("/auth/zoho/token", async (req, res) => {
  const { code } = req.body;

  const dc = zohoDcStore.get(code);
  if (!dc) {
    return res.status(400).json({ error: "Zoho DC not found for code" });
  }

  const tokenRes = await fetch(
    `${dc.accountsServer}/oauth/v2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(req.body),
    }
  );

  const tokenJson = await tokenRes.json(); // ✅ parse JSON

  // 🔑 bind DC to access_token
  zohoDcStore.set(tokenJson.access_token, dc);

  // optional cleanup
  zohoDcStore.delete(code);

  res.json(tokenJson); // ✅ return JSON
});



app.get("/auth/zoho/userinfo", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const accessToken = authHeader.replace("Bearer ", "");
  const dc = zohoDcStore.get(accessToken);

  if (!dc) {
    return res.status(400).json({ error: "DC not found for access token" });
  }

  const zohoRes = await fetch(
    `${dc.accountsServer}/oauth/user/info`,
    {
      headers: { Authorization: authHeader },
    }
  );

  const profile = await zohoRes.json();

  console.log("🔍 ZOHO PROFILE RAW:", profile);

  res.json({
    id: String(profile.ZUID ?? profile.id),
    email: profile.Email?.toLowerCase(),
    name:
      profile.Display_Name ||
      `${profile.First_Name ?? ""} ${profile.Last_Name ?? ""}`.trim(),
    emailVerified: true,
    image: null,
  });
});




/* ======================================================================
   JWT utilities
   ====================================================================== */
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

/* ======================================================================
   APIs
   ====================================================================== */

app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

app.get("/api/protected", requireJwt, (req, res) => {
  res.json({ user: req.user });
});

/* ======================================================================
   🔑 IMPORTANT: Capture Zoho DC DURING TOKEN EXCHANGE
   ====================================================================== */

/**
 * Zoho returns `accounts-server` only during authorization callback,
 * BUT Better Auth already owns that route.
 *
 * So we extract DC lazily from Zoho error responses if needed.
 * (Zoho validates DC via token endpoint anyway.)
 */

/* ======================================================================
   Export
   ====================================================================== */
export default app;
