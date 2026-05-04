
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ data: { success: true } });
  res.cookies.set("session", "", { path: "/", expires: new Date(0), httpOnly: true, secure: true, sameSite: "strict" });
  return res;
}
