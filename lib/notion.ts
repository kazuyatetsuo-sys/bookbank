import { Client } from "@notionhq/client";

export function getNotionClient(accessToken: string) {
  return new Client({ auth: accessToken });
}

// ==================== Books ====================

export async function fetchBooks(notion: Client, dbId: string) {
  const res = await notion.databases.query({
    database_id: dbId,
    filter: { property: "Archived", checkbox: { equals: false } },
    sorts: [{ property: "CreatedAt", direction: "descending" }],
  });
  return res.results;
}

export async function createBook(
  notion: Client,
  dbId: string,
  data: {
    title: string;
    author: string;
    genre: string;
    bookId: string;
    coverUrl?: string;
    memo?: string;
    chapterTitles?: string;
    headlineTitles?: string;
  }
) {
  const properties: Parameters<typeof notion.pages.create>[0]["properties"] = {
    Title: { title: [{ text: { content: data.title } }] },
    Author: { rich_text: [{ text: { content: data.author } }] },
    BookId: { rich_text: [{ text: { content: data.bookId } }] },
    Archived: { checkbox: false },
    CreatedAt: { date: { start: new Date().toISOString() } },
  };
  if (data.genre) {
    properties.Genre = { select: { name: data.genre } };
  }
  if (data.memo) { properties.Memo = { rich_text: [{ text: { content: data.memo } }] }; }
  if (data.chapterTitles !== undefined) { properties.ChapterTitles = { rich_text: [{ text: { content: data.chapterTitles } }] }; }
  if (data.headlineTitles !== undefined) { properties.HeadlineTitles = { rich_text: [{ text: { content: data.headlineTitles } }] }; }
  if (data.coverUrl) {
    properties.CoverUrl = { url: data.coverUrl };
  }
  return notion.pages.create({ parent: { database_id: dbId }, properties });
}

export async function updateBook(
  notion: Client,
  pageId: string,
  data: { title?: string; author?: string; genre?: string; coverUrl?: string; memo?: string; chapterTitles?: string; headlineTitles?: string }
) {
  const properties: Parameters<typeof notion.pages.create>[0]["properties"] = {};
  if (data.title) properties.Title = { title: [{ text: { content: data.title } }] };
  if (data.author !== undefined) properties.Author = { rich_text: [{ text: { content: data.author } }] };
  if (data.genre) properties.Genre = { select: { name: data.genre } };
  if (data.memo !== undefined) properties.Memo = { rich_text: [{ text: { content: data.memo } }] };
  if (data.chapterTitles !== undefined) properties.ChapterTitles = { rich_text: [{ text: { content: data.chapterTitles } }] };
  if (data.headlineTitles !== undefined) properties.HeadlineTitles = { rich_text: [{ text: { content: data.headlineTitles } }] };
  if (data.coverUrl !== undefined) properties.CoverUrl = { url: data.coverUrl || null };
  return notion.pages.update({ page_id: pageId, properties });
}

export async function archiveBook(notion: Client, pageId: string) {
  return notion.pages.update({
    page_id: pageId,
    properties: { Archived: { checkbox: true } },
  });
}

// ==================== Contents ====================

export async function fetchContents(
  notion: Client,
  dbId: string,
  options: {
    bookId?: string;
    genre?: string;
    tag?: string;
    archived?: boolean;
    limit?: number;
  } = {}
) {
  const filters: unknown[] = [
    { property: "Archived", checkbox: { equals: options.archived ?? false } },
  ];
  if (options.bookId) {
    filters.push({ property: "BookId", rich_text: { equals: options.bookId } });
  }
  if (options.genre) {
    filters.push({ property: "Genre", select: { equals: options.genre } });
  }
  if (options.tag) {
    filters.push({ property: "Tags", multi_select: { contains: options.tag } });
  }

  const res = await notion.databases.query({
    database_id: dbId,
    filter: { and: filters } as Parameters<Client["databases"]["query"]>[0]["filter"],
    sorts: [{ property: "CreatedAt", direction: "descending" }],
    page_size: options.limit ?? 100,
  });
  return res.results;
}

export async function createContent(
  notion: Client,
  dbId: string,
  data: {
    contents: string;
    detail?: string;
    memo: string;
    bookId: string;
    bookTitle: string;
    chapter: number;
    headline: number;
    order?: number;
    genre: string;
    author: string;
    tags: string[];
    relIds: string;
    imageUrl?: string;
    appId: string;
  }
) {
  const autoTitle = `${data.bookTitle} Ch.${String(data.chapter).padStart(2, "0")} HL.${String(data.headline).padStart(2, "0")}`;
  const properties: Parameters<typeof notion.pages.create>[0]["properties"] = {
    Title: { title: [{ text: { content: autoTitle } }] },
    Contents: { rich_text: [{ text: { content: data.contents } }] },
    Detail: { rich_text: [{ text: { content: data.detail ?? "" } }] },
    Memo: { rich_text: [{ text: { content: data.memo } }] },
    BookId: { rich_text: [{ text: { content: data.bookId } }] },
    BookTitle: { rich_text: [{ text: { content: data.bookTitle } }] },
    Chapter: { number: data.chapter },
    Headline: { number: data.headline },
    order: { number: data.order ?? 0 },
    Author: { rich_text: [{ text: { content: data.author } }] },
    Tags: { multi_select: data.tags.map((t) => ({ name: t })) },
    RelIds: { rich_text: [{ text: { content: data.relIds } }] },
    AppId: { rich_text: [{ text: { content: data.appId } }] },
    Archived: { checkbox: false },
    CreatedAt: { date: { start: new Date().toISOString() } },
    UpdatedAt: { date: { start: new Date().toISOString() } },
  };
  if (data.genre) {
    properties.Genre = { select: { name: data.genre } };
  }
  if (data.imageUrl) {
    properties.ImageUrl = { rich_text: [{ text: { content: data.imageUrl } }] };
  }
  return notion.pages.create({ parent: { database_id: dbId }, properties });
}

export async function updateContent(
  notion: Client,
  pageId: string,
  data: {
    contents?: string;
    detail?: string;
    memo?: string;
    bookId?: string;
    bookTitle?: string;
    chapter?: number;
    headline?: number;
    order?: number;
    genre?: string;
    author?: string;
    tags?: string[];
    relIds?: string;
    imageUrl?: string;
  }
) {
  const properties: Parameters<typeof notion.pages.create>[0]["properties"] = {
    UpdatedAt: { date: { start: new Date().toISOString() } },
  };
  if (data.contents !== undefined) properties.Contents = { rich_text: [{ text: { content: data.contents } }] };
  if (data.detail !== undefined) properties.Detail = { rich_text: [{ text: { content: data.detail } }] };
  if (data.memo !== undefined) properties.Memo = { rich_text: [{ text: { content: data.memo } }] };
  if (data.bookId !== undefined) properties.BookId = { rich_text: [{ text: { content: data.bookId } }] };
  if (data.bookTitle !== undefined) {
    properties.BookTitle = { rich_text: [{ text: { content: data.bookTitle } }] };
    const ch = data.chapter ?? 0;
    const hl = data.headline ?? 0;
    properties.Title = {
      title: [{ text: { content: `${data.bookTitle} Ch.${String(ch).padStart(2, "0")} HL.${String(hl).padStart(2, "0")}` } }],
    };
  }
  if (data.chapter !== undefined) properties.Chapter = { number: data.chapter };
  if (data.headline !== undefined) properties.Headline = { number: data.headline };
  if (data.order !== undefined) properties.order = { number: data.order };
  if (data.genre !== undefined) properties.Genre = { select: data.genre ? { name: data.genre } : null };
  if (data.author !== undefined) properties.Author = { rich_text: [{ text: { content: data.author } }] };
  if (data.tags !== undefined) properties.Tags = { multi_select: data.tags.map((t) => ({ name: t })) };
  if (data.relIds !== undefined) properties.RelIds = { rich_text: [{ text: { content: data.relIds } }] };
  if (data.imageUrl) properties.ImageUrl = { rich_text: [{ text: { content: data.imageUrl } }] };
  return notion.pages.update({ page_id: pageId, properties });
}

export async function archiveContent(notion: Client, pageId: string, archived: boolean) {
  return notion.pages.update({
    page_id: pageId,
    properties: {
      Archived: { checkbox: archived },
      UpdatedAt: { date: { start: new Date().toISOString() } },
    },
  });
}

// ==================== Sorts ====================

export async function fetchSorts(notion: Client, dbId: string) {
  const res = await notion.databases.query({
    database_id: dbId,
    sorts: [{ property: "Order", direction: "ascending" }],
  });
  return res.results;
}

export async function createSort(
  notion: Client,
  dbId: string,
  data: { name: string; sortId: string; conds: string; order: string }
) {
  return notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: data.name } }] },
      SortId: { rich_text: [{ text: { content: data.sortId } }] },
      Conds: { rich_text: [{ text: { content: data.conds } }] },
      Order: { rich_text: [{ text: { content: data.order } }] },
    },
  });
}

export async function updateSort(
  notion: Client,
  pageId: string,
  data: { name?: string; conds?: string; order?: string }
) {
  const properties: Parameters<typeof notion.pages.create>[0]["properties"] = {};
  if (data.name) properties.Name = { title: [{ text: { content: data.name } }] };
  if (data.conds !== undefined) properties.Conds = { rich_text: [{ text: { content: data.conds } }] };
  if (data.order !== undefined) properties.Order = { rich_text: [{ text: { content: data.order } }] };
  return notion.pages.update({ page_id: pageId, properties });
}

export async function deleteSort(notion: Client, pageId: string) {
  return notion.pages.update({ page_id: pageId, archived: true });
}

// ==================== Helpers ====================

export function extractText(prop: unknown): string {
  if (!prop || typeof prop !== "object") return "";
  const p = prop as Record<string, unknown>;
  if (p.type === "title" && Array.isArray(p.title)) {
    return (p.title as Array<{ plain_text: string }>).map((t) => t.plain_text).join("");
  }
  if (p.type === "rich_text" && Array.isArray(p.rich_text)) {
    return (p.rich_text as Array<{ plain_text: string }>).map((t) => t.plain_text).join("");
  }
  if (p.type === "select" && p.select && typeof p.select === "object") {
    return (p.select as { name: string }).name ?? "";
  }
  if (p.type === "number" && p.number !== null && p.number !== undefined) {
    return String(p.number);
  }
  if (p.type === "checkbox") return p.checkbox ? "true" : "false";
  if (p.type === "url") return (p.url as string) ?? "";
  if (p.type === "date" && p.date && typeof p.date === "object") {
    return (p.date as { start: string }).start ?? "";
  }
  return "";
}

export function extractMultiSelect(prop: unknown): string[] {
  if (!prop || typeof prop !== "object") return [];
  const p = prop as Record<string, unknown>;
  if (p.type === "multi_select" && Array.isArray(p.multi_select)) {
    return (p.multi_select as Array<{ name: string }>).map((t) => t.name);
  }
  return [];
}
