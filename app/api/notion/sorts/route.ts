import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getNotionClient,
  fetchSorts,
  createSort,
  updateSort,
  deleteSort,
  extractText,
} from "@/lib/notion";

const SORTS_DB_ID = process.env.DEFAULT_SORTS_DB_ID!;

export async function GET() {
  const session = await getSession();
  if (!session.notionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notion = getNotionClient(session.notionAccessToken);
  const results = await fetchSorts(notion, SORTS_DB_ID);

  const sorts = results.map((page: unknown) => {
    const p = page as { id: string; properties: Record<string, unknown> };
    return {
      id: p.id,
      name: extractText(p.properties.Name),
      sortId: extractText(p.properties.SortId),
      conds: extractText(p.properties.Conds),
      order: extractText(p.properties.Order),
    };
  });

  return NextResponse.json({ sorts });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.notionAccessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notion = getNotionClient(session.notionAccessToken);
  const body = await req.json();

  const sortId = `sort_${Date.now()}`;
  await createSort(notion, SORTS_DB_ID, {
    name: body.name,
    sortId,
    conds: JSON.stringify(body.conds ?? {}),
    order: body.order ?? "0",
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

  if (body.delete) {
    await deleteSort(notion, body.pageId);
  } else {
    await updateSort(notion, body.pageId, {
      name: body.name,
      conds: body.conds ? JSON.stringify(body.conds) : undefined,
      order: body.order,
    });
  }

  return NextResponse.json({ ok: true });
}
