import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NOTION_CLIENT_ID!;
  const redirectUri = process.env.NOTION_REDIRECT_URI || "https://bookbank-rho.vercel.app/api/notion/callback";
  const url = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;
  return NextResponse.redirect(url);
}
