import { NextResponse, type NextRequest } from "next/server";

const VISITED_COOKIE = "dissent_visited";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function middleware(request: NextRequest) {
  if (request.cookies.has(VISITED_COOKIE)) {
    return NextResponse.redirect(new URL("/home", request.url), 307);
  }

  const response = NextResponse.next();
  response.cookies.set(VISITED_COOKIE, "true", {
    maxAge: THIRTY_DAYS,
    path: "/",
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}

export const config = {
  matcher: ["/"],
};
