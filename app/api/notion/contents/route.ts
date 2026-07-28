import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getNotionClient,
  fetchContents,
  createContent,
  updateContent,
  archiveContent,
  extractText,
  extractMultiSelect,
} from "@/lib/notion";

const CONTENTS_DB_ID = process.env.DEFAULT_CONTENTS_DB_ID!;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.notionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notion = getNotionClient(session.notionAccessToken);
  const { searchParams } = new URL(req.url);

  try {
    const results = await fetchContents(notion, CONTENTS_DB_ID, {
      bookId: searchParams.get("bookId") ?? undefined,
      genre: searchParams.get("genre") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      archived: searchParams.get("archived") === "true",
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
    });

    console.log(`[GET /api/notion/contents] fetched ${results.length} items`);

    const contents = results.map((page: unknown) => {
      const p = page as { id: string; properties: Record<string, unknown> };
      return {
        id: p.id,
        title: extractText(p.properties.Title),
        contents: extractText(p.properties.Contents),
        detail: extractText(p.properties.Detail),
        memo: extractText(p.properties.Memo),
        bookId: extractText(p.properties.BookId),
        bookTitle: extractText(p.properties.BookTitle),
        chapter: Number(extractText(p.properties.Chapter)) || 0,
        headline: Number(extractText(p.properties.Headline)) || 0,
        order: Number(extractText(p.properties.order)) || 0,
        genre: extractText(p.properties.Genre),
        author: extractText(p.properties.Author),
        tags: extractMultiSelect(p.properties.Tags),
        relIds: extractText(p.properties.RelIds),
        imageUrl: extractText(p.properties.ImageUrl),
        archived: extractText(p.properties.Archived) === "true",
        createdAt: extractText(p.properties.CreatedAt),
        updatedAt: extractText(p.properties.UpdatedAt),
      };
    });

    return NextResponse.json({ contents });
  } catch (e) {
    console.error("[GET /api/notion/contents] error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.notionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notion = getNotionClient(session.notionAccessToken);
  const body = await req.json();
  console.log("[POST /api/notion/contents] body:", JSON.stringify(body));

  try {
    await createContent(notion, CONTENTS_DB_ID, {
      contents: body.contents ?? "",
      detail: body.detail ?? "",
      memo: body.memo ?? "",
      bookId: body.bookId ?? "",
      bookTitle: body.bookTitle ?? "",
      chapter: body.chapter ?? 0,
      headline: body.headline ?? 0,
      order: body.order ?? 0,
      genre: body.genre ?? "",
      author: body.author ?? "",
      tags: body.tags ?? [],
      relIds: body.relIds ?? "",
      imageUrl: body.imageUrl ?? "",
      appId: body.appId ?? "bookbank",
    });
    console.log("[POST /api/notion/contents] success");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/notion/contents] Notion error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.notionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notion = getNotionClient(session.notionAccessToken);
  const body = await req.json();
  console.log("[PUT /api/notion/contents] body:", JSON.stringify(body));

  try {
    if (body.archive !== undefined) {
      await archiveContent(notion, body.pageId, body.archive);
    } else {
      await updateContent(notion, body.pageId, {
        contents: body.contents,
        detail: body.detail,
        memo: body.memo,
        bookId: body.bookId,
        bookTitle: body.bookTitle,
        chapter: body.chapter,
        headline: body.headline,
        order: body.order,
        genre: body.genre,
        author: body.author,
        tags: body.tags,
        relIds: body.relIds,
        imageUrl: body.imageUrl,
      });
    }
    console.log("[PUT /api/notion/contents] success");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PUT /api/notion/contents] Notion error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
