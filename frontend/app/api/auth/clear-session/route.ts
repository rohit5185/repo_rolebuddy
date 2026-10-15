import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Session cleared.", data: null },
    { status: 200 }
  );

  // Delete the Vercel-domain accessToken cookie
  response.cookies.delete("accessToken");

  return response;
}
