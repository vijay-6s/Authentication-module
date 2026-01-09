import { auth } from "@/lib/auth";
import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";

export async function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });
    if (!session || !session.user) {{
        return res.status(401).json({ error: "Unauthorized user" });
    }}
    next();
}