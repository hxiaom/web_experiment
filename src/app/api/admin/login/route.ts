import { NextResponse } from "next/server";
import { createAdminCookieToken, getCookieOptionsForResponse, ADMIN_COOKIE } from "@/lib/session";
import { requireEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  let parsed: any;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const password = (parsed?.password ?? "").toString();
  if (!password) return NextResponse.json({ ok: false, error: "missing_password" }, { status: 400 });

  if (password !== requireEnv("ADMIN_PASSWORD")) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
  }

  const token = createAdminCookieToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, { ...getCookieOptionsForResponse(), maxAge: 60 * 60 * 24 * 7 });
  return res;
}

