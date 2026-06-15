import { SignJWT, jwtVerify } from "jose";
import * as bcryptjs from "bcryptjs";
import type { JWTPayload } from "jose";

// ── CRITICAL: JWT Secret is REQUIRED in production ───────
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is REQUIRED in production. Set it before deploying.");
  }
  // Development mode only
}

const secretKey = JWT_SECRET || "dev-fallback-secret-do-not-use-in-prod";
const secret = new TextEncoder().encode(secretKey);

export async function hashPassword(pw: string) {
  return bcryptjs.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcryptjs.compare(pw, hash);
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ userId: string; workspaceId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      workspaceId: payload.workspaceId as string,
      role: payload.role as string,
    };
  } catch (error) {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64").toString("utf-8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
