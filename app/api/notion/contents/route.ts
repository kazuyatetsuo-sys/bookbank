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

  const results = await fetchContents(notion, CONTENTS_DB_ID, {
    bookId: searchParams.get("bookId") ?? undefined,
    genre: searchParams.get("genre") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
    archived: searchParams.get("archived") === "true",
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  });

  const contents = results.map((page: unknown) => {
    const p = page as { id: string; properties: Record<string, unknown> };
    return {
      id: p.id,
      title: extractText(p.properties.Title),
      contents: extractText(p.properties.Contents),
      memo: extractText(p.properties.Memo),
      bookId: extractText(p.properties.BookId),
      bookTitle: extractText(p.properties.BookTitle),
      chapter: Number(extractText(p.properties.Chapter)) || 0,
      headline: Number(extractText(p.properties.Headline)) || 0,
      genre: extractText(p.properties.Genre),
      author: extractText(p.properties.Author),
      tags: extractMultiSelect(p.properties.Tags),
      relIds: extractText(p.properties.RelIds),
      archived: extractText(p.properties.Archived) === "true",
      createdAt: extractText(p.properties.CreatedAt),
      updatedAt: extractText(p.properties.UpdatedAt),
    };
  });

  return NextResponse.json({ contents });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.notionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notion = getNotionClient(session.notionAccessToken);
  const body = await req.json();

  await createContent(notion, CONTENTS_DB_ID, {
    contents: body.contents ?? "",
    memo: body.memo ?? "",
    bookId: body.bookId ?? "",
    bookTitle: body.bookTitle ?? "",
    chapter: body.chapter ?? 0,
    headline: body.headline ?? 0,
    genre: body.genre ?? "",
    author: body.author ?? "",
    tags: body.tags ?? [],
    relIds: body.relIds ?? "",
    appId: body.appId ?? "bookbank",
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.notionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notion = getNotionClient(session.notionAccessToken);
  const body = await req.json();

  if (body.archive !== undefined) {
    await archiveContent(notion, body.pageId, body.archive);
  } else {
    await updateContent(notion, body.pageId, {
      contents: body.contents,
      memo: body.memo,
      bookId: body.bookId,
      bookTitle: body.bookTitle,
      chapter: body.chapter,
      headline: body.headline,
      genre: body.genre,
      author: body.author,
      tags: body.tags,
      relIds: body.relIds,
    });
  }

  return NextResponse.json({ ok: true });
}
