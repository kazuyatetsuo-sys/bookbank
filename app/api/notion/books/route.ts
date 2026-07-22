import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getNotionClient,
  fetchBooks,
  createBook,
  updateBook,
  archiveBook,
  extractText,
} from "@/lib/notion";

const BOOKS_DB_ID = process.env.DEFAULT_BOOKS_DB_ID!;

export async function GET() {
  const session = await getSession();
  if (!session.notionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notion = getNotionClient(session.notionAccessToken);
  const results = await fetchBooks(notion, BOOKS_DB_ID);

  const books = results.map((page: unknown) => {
    const p = page as { id: string; properties: Record<string, unknown> };
    return {
      id: p.id,
      title: extractText(p.properties.Title),
      author: extractText(p.properties.Author),
      genre: extractText(p.properties.Genre),
      bookId: extractText(p.properties.BookId),
      coverUrl: extractText(p.properties.CoverUrl),
      memo: extractText(p.properties.Memo),
      chapterTitles: extractText(p.properties.ChapterTitles),
      headlineTitles: extractText(p.properties.HeadlineTitles),
      createdAt: extractText(p.properties.CreatedAt),
    };
  });

  return NextResponse.json({ books });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.notionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notion = getNotionClient(session.notionAccessToken);
  const body = await req.json();

  const bookId = `book_${Date.now()}`;
  await createBook(notion, BOOKS_DB_ID, {
    title: body.title,
    author: body.author ?? "",
    genre: body.genre ?? "",
    bookId,
    coverUrl: body.coverUrl,
    memo: body.memo ?? "",
    chapterTitles: body.chapterTitles ?? "",
    headlineTitles: body.headlineTitles ?? "",
  });

  return NextResponse.json({ ok: true, bookId });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.notionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notion = getNotionClient(session.notionAccessToken);
  const body = await req.json();
  console.log("[PUT /api/notion/books] body:", JSON.stringify(body));

  try {
    if (body.archive) {
      await archiveBook(notion, body.pageId);
    } else {
      await updateBook(notion, body.pageId, {
        title: body.title,
        author: body.author,
        genre: body.genre,
        coverUrl: body.coverUrl,
        memo: body.memo ?? "",
        chapterTitles: body.chapterTitles ?? "",
        headlineTitles: body.headlineTitles ?? "",
      });
    }
    console.log("[PUT /api/notion/books] success");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PUT /api/notion/books] Notion error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
