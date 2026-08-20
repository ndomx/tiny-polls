import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getOrCreateVoterId, voterCookieName } from "@/lib/voter";

export async function GET() {
  const cookieStore = await cookies();
  const voterId = getOrCreateVoterId(cookieStore.get(voterCookieName)?.value);
  const response = NextResponse.json({ voterId });

  response.cookies.set(voterCookieName, voterId, {
    httpOnly: true,
    maxAge: 31536000,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
