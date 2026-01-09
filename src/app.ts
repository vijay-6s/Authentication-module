import express from "express";
import cors from "cors";
import { auth } from "@/lib/auth";
import router from "./routes";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Better Auth routes
app.use("/api/auth", toNodeHandler(auth));

// 🔐 JWT verification setup
const JWKS = createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
);

const requireJwt = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  try {
    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: "http://localhost:3000",
      audience: "http://localhost:3000",
    });

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};


app.get("/api/protected", requireJwt, (req, res) => {
  res.json({
    message: "Access granted 🎉",
    user: req.user,
  });
});

// Session-based (cookie) auth
app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

app.use("/api", router);

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the BetterAuth API" });
});

export default app;
