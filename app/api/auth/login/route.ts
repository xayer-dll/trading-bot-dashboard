import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { password } = await req.json();
  const correct = process.env.DASHBOARD_PASSWORD ?? "trading123";

  if (password !== correct) {
    return NextResponse.json({ error: "Hatalı şifre" }, { status: 401 });
  }

  // 7 günlük güvenli cookie
  const res = NextResponse.json({ ok: true });
  res.cookies.set("dashboard_auth", process.env.DASHBOARD_SECRET ?? "secret_token_123", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 7,   // 7 gün
    path:     "/",
  });
  return res;
}
