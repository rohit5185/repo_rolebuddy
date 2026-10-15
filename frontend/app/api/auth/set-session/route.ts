import { NextRequest, NextResponse } from "next/server";

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token : null;

    if (!token) {
      return NextResponse.json(
        { message: "No token provided.", data: null },
        { status: 400 }
      );
    }

    const response = NextResponse.json(
      { message: "Session set.", data: null },
      { status: 200 }
    );

    // Set the cookie on the Vercel domain (rolebuddy.vercel.app)
    // SameSite=Lax is fine here — this is a same-origin cookie for Vercel
    // HttpOnly prevents JS access; middleware.ts reads it server-side
    response.cookies.set("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: "Invalid request.", data: null },
      { status: 400 }
    );
  }
}
