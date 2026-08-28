"use client";
import { useState } from "react";
import { Content, Book } from "@/hooks/useBookBank";
import DetailModal from "./DetailModal";
import ContentModal from "./ContentModal";

interface Props {
  contents: Content[];
  books: Book[];
  genres: string[];
  allContents: Content[];
  onUpdate: (pageId: string, data: Partial<Content>) => Promise<void>;
  onArchive: (pageId: string, archived: boolean) => Promise<void>;
}

type ViewMode = "card" | "table";

export default function ContentList({ contents, books, genres, allContents, onUpdate, onArchive }: Props) {
  const [view, setView] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterBook, setFilterBook] = useState("");
  const [detail, setDetail] = useState<Content | null>(null);
  const [editing, setEditing] = useState<Content | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  // filter
  const filtered = contents.filter((c) => {
    if (c.archived) return false;
    if (search && !c.title.includes(search) && !c.contents.includes(search) && !c.memo.includes(search)) return false;
    if (filterTag && !c.tags.includes(filterTag)) return false;
    if (filterBook && c.bookId !== filterBook) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // all tags
  const allTags = Array.from(new Set(contents.flatMap((c) => c.tags)));

  const handleEdit = (c: Content) => {
    setDetail(null);
    setEditing(c);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-amber-400/50"
          placeholder="検索…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm focus:outline-none"
          value={filterBook}
          onChange={(e) => { setFilterBook(e.target.value); setPage(1); }}
        >
          <option value="">すべての書籍</option>
          {books.map((b) => <option key={b.bookId} value={b.bookId}>{b.title}</option>)}
        </select>
        <select
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 text-sm focus:outline-none"
          value={filterTag}
          onChange={(e) => { setFilterTag(e.target.value); setPage(1); }}
        >
          <option value="">すべてのタグ</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {/* View toggle */}
        <div className="flex border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setView("card")}
            className={`px-3 py-2 text-sm transition ${view === "card" ? "bg-amber-400 text-black" : "text-white/50 hover:text-white"}`}
          >⊞</button>
          <button
            onClick={() => setView("table")}
            className={`px-3 py-2 text-sm transition ${view === "table" ? "bg-amber-400 text-black" : "text-white/50 hover:text-white"}`}
          >≡</button>
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-white/30">{filtered.length}件</p>

      {/* Card View */}
      {view === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paginated.map((c) => (
            <button
              key={c.id}
              onClick={() => setDetail(c)}
              className="text-left bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-amber-400/30 hover:bg-white/5 transition group"
            >
              <p className="text-xs text-amber-400/60 mb-1">
                {c.bookTitle} · Ch.{String(c.chapter).padStart(2, "0")} HL.{String(c.headline).padStart(2, "0")}
              </p>
              <p className="text-white text-sm font-medium line-clamp-1 mb-2">{c.contents || c.title}</p>
              {c.memo && <p className="text-white/40 text-xs line-clamp-2 mb-3">{c.memo}</p>}
              <div className="flex flex-wrap gap-1">
                {c.tags.slice(0, 3).map((t) => (
                  <span key={t} className="px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded-full text-xs">{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <div className="overflow-x-auto rounded-2xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-white/40 font-normal">書籍</th>
                <th className="text-left px-4 py-3 text-white/40 font-normal">Ch</th>
                <th className="text-left px-4 py-3 text-white/40 font-normal">HL</th>
                <th className="text-left px-4 py-3 text-white/40 font-normal">Contents</th>
                <th className="text-left px-4 py-3 text-white/40 font-normal">タグ</th>
                <th className="text-left px-4 py-3 text-white/40 font-normal">日付</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setDetail(c)}
                  className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition"
                >
                  <td className="px-4 py-3 text-white/60 truncate max-w-[120px]">{c.bookTitle}</td>
                  <td className="px-4 py-3 text-white/40">{String(c.chapter).padStart(2, "0")}</td>
                  <td className="px-4 py-3 text-white/40">{String(c.headline).padStart(2, "0")}</td>
                  <td className="px-4 py-3 text-white truncate max-w-[200px]">{c.contents}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {c.tags.slice(0, 2).map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded-full text-xs">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("ja-JP") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm transition ${p === page ? "bg-amber-400 text-black font-semibold" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-white/20 text-sm">コンテンツがありません</div>
      )}

      {/* Detail Modal */}
      {detail && (
        <DetailModal
          content={detail}
          books={books}
          allContents={allContents}
          onClose={() => setDetail(null)}
          onEdit={() => handleEdit(detail)}
          onArchive={() => { onArchive(detail.id, !detail.archived); setDetail(null); }}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <ContentModal
          books={books}
          genres={genres}
          allContents={allContents}
          editing={editing}
          onClose={() => setEditing(null)}
          onSave={async () => {}}
          onUpdate={async (pageId, data, keepOpen) => { await onUpdate(pageId, data); if (!keepOpen) setEditing(null); }}
        />
      )}
    </div>
  );
}
