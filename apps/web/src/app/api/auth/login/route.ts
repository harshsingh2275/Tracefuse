import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const backendUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";

  try {
    const body = await request.json().catch(() => ({}));
    const passcode = body.passcode || "";

    const res = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passcode }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Invalid access passcode." },
        { status: res.status }
      );
    }

    const data = await res.json();
    const token = data.token;

    const response = NextResponse.json({
      status: "ok",
      message: "Authenticated successfully",
    });

    const isSecure =
      process.env.NODE_ENV === "production" ||
      process.env.COOKIE_SECURE === "true";

    if (token) {
      response.cookies.set({
        name: "tracefuse_jwt",
        value: token,
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 12 * 3600,
        path: "/",
      });
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Backend auth connection error: ${message}` },
      { status: 500 }
    );
  }
}
