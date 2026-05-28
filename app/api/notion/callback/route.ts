import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=no_code", req.url));

  const clientId = process.env.NOTION_CLIENT_ID!;
  const clientSecret = process.env.NOTION_CLIENT_SECRET!;
  const redirectUri = process.env.NOTION_REDIRECT_URI!;

  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  });

  if (!tokenRes.ok) return NextResponse.redirect(new URL("/login?error=token_failed", req.url));

  const token = await tokenRes.json();
  const session = await getSession();
  session.notionAccessToken = token.access_token;
  session.notionWorkspaceId = token.workspace_id;
  session.notionBotId = token.bot_id;
  await session.save();

  return NextResponse.redirect(new URL("/dashboard", req.url));
}
