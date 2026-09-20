import { NextRequest, NextResponse } from "next/server";

const DEMO_USER = "admin";
const DEMO_PASS = "admin";

export async function GET(req: NextRequest) {
  const authCookie = req.cookies.get("demo_auth");
  const isAuthed = authCookie?.value === "1";
  return NextResponse.json({ authed: isAuthed });
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (username === DEMO_USER && password === DEMO_PASS) {
      const res = NextResponse.json({ ok: true });
      res.cookies.set("demo_auth", "1", {
        httpOnly: false, // allow client-side detection to prevent refresh flicker
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
      });
      return res;
    }

    return NextResponse.json({ ok: false, error: "Invalid username or password" }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("demo_auth");
  return res;
}

