import { SignJWT, jwtVerify } from "jose";
import bcryptjs from "bcryptjs";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "crm-hub-default-secret-change-in-prod"
);

export async function hashPassword(pw: string) {
  return bcryptjs.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcryptjs.compare(pw, hash);
}

export async function createToken(payload: {
  userId: string;
  email: string;
  workspaceId: string;
  role: string;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
    return payload as { userId: string; email: string; workspaceId: string; role: string };
  } catch {
    return null;
  }
}
