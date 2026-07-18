import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "No url" }, { status: 400 });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
    });
    const html = await res.text();
    const match = html.match(/og:image" content="([^"]+)"/);
    if (!match) return NextResponse.json({ error: "No image found" }, { status: 404 });
    const imageUrl = match[1];
    if (!imageUrl.includes("lh3.googleusercontent.com")) {
      return NextResponse.json({ error: "Not a Google Photos image" }, { status: 400 });
    }
    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
