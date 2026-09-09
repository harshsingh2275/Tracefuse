import { NextResponse } from "next/server";

export async function POST() {
  const backendUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  try {
    await fetch(`${backendUrl}/auth/logout`, {
      method: "POST",
      cache: "no-store",
    }).catch(() => {});
  } catch {
    // Ignore backend connection errors on logout
  }

  const response = NextResponse.json({
    status: "ok",
    message: "Logged out successfully",
  });

  response.cookies.set({
    name: "tracefuse_jwt",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
