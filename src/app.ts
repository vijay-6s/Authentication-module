import express from "express";
import cors from "cors";
import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";
import { auth } from "@/lib/auth";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";

import {
  storeDcByCode,
  getDcByCode,
  bindDcToToken,
  deleteCode,
  getDcByToken,
  deleteToken,
} from "@/lib/zoho-dc.store";

/* -------------------- Types -------------------- */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const app = express();

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
   Zoho DC Whitelist (SECURITY CRITICAL)
   ====================================================================== */
const ALLOWED_ZOHO_DCS = [
  "https://accounts.zoho.com",
  "https://accounts.zoho.in",
  "https://accounts.zoho.eu",
  "https://accounts.zoho.com.au",
  "https://accounts.zoho.jp",
];

/* ======================================================================
   Better Auth (MUST be mounted before dependent routes)
   ====================================================================== */
const betterAuthHandler = toNodeHandler(auth);

/**
 * Intercept Zoho OAuth callback to capture DC
 */
app.use("/api/auth", async (req, res) => {
  if (req.method === "GET" && req.path === "/oauth2/callback/zoho") {
    const {
      code,
      location,
      "accounts-server": accountsServer,
    } = req.query as {
      code?: string;
      location?: string;
      "accounts-server"?: string;
    };

    if (
      code &&
      accountsServer &&
      ALLOWED_ZOHO_DCS.includes(accountsServer)
    ) {
      await storeDcByCode(code, {
        accountsServer,
        location,
      });
    }
  }

  betterAuthHandler(req, res);
});

/* ======================================================================
   ZOHO INTERCEPTOR ROUTES
   ====================================================================== */

/**
 * Exchange authorization code → access token
 */
app.post("/auth/zoho/token", async (req, res) => {
  const { code } = req.body as { code: string };

  const dc = await getDcByCode(code);
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

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return res
      .status(400)
      .json({ error: "Zoho token exchange failed", err });
  }

  const tokenJson: {
    access_token: string;
    expires_in: number;
  } = await tokenRes.json();

  await bindDcToToken(
    tokenJson.access_token,
    dc,
    Math.min(tokenJson.expires_in, 3600)
  );

  // one-time use
  await deleteCode(code);

  res.json(tokenJson);
});

/**
 * Fetch Zoho user profile
 */
app.get("/auth/zoho/userinfo", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const accessToken = authHeader.replace("Bearer ", "");
  const dc = await getDcByToken(accessToken);

  if (!dc) {
    return res.status(400).json({ error: "DC not found for access token" });
  }

  const zohoRes = await fetch(
    `${dc.accountsServer}/oauth/user/info`,
    {
      headers: { Authorization: authHeader },
    }
  );

  if (!zohoRes.ok) {
    const err = await zohoRes.text();
    return res
      .status(400)
      .json({ error: "Zoho userinfo failed", err });
  }

  const profile = await zohoRes.json();

  // 🔥 cleanup BEFORE response
  await deleteToken(accessToken);

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
   JWT Utilities
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
   Export
   ====================================================================== */
export default app;
