import { NextRequest, NextResponse } from "next/server";

const DEMO_USER = "admin";
const DEMO_PASS = "admin";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (username === DEMO_USER && password === DEMO_PASS) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("demo_auth", "1", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("demo_auth");
  return res;
}
