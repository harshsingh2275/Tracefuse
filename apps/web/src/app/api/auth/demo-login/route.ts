import { NextResponse } from "next/server";

export async function POST() {
  const backendUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";
  const demoPasscode = process.env.DEMO_PASSCODE || "demo2026";

  try {
    const res = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ passcode: demoPasscode }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Authentication failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const token = data.token;

    const response = NextResponse.json({
      status: "ok",
      message: "Fast-track demo authentication successful",
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
