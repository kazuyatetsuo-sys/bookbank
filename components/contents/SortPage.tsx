"use client";
import { useState } from "react";
import { Content, Sort, Book } from "@/hooks/useBookBank";
import DetailModal from "../contents/DetailModal";
import ContentModal from "../contents/ContentModal";

interface Props {
  sorts: Sort[];
  contents: Content[];
  books: Book[];
  genres: string[];
  onAddSort: (data: { name: string; conds: Record<string, unknown> }) => Promise<void>;
  onDeleteSort: (pageId: string) => Promise<void>;
  onUpdate: (pageId: string, data: Partial<Content>) => Promise<void>;
  onArchive: (pageId: string, archived: boolean) => Promise<void>;
}

interface SortConds {
  bookId?: string;
  genre?: string;
  tag?: string;
  author?: string;
}

export default function SortPage({ sorts, contents, books, genres, onAddSort, onDeleteSort, onUpdate, onArchive }: Props) {
  const [activeSort, setActiveSort] = useState<Sort | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSortName, setNewSortName] = useState("");
  const [conds, setConds] = useState<Record<string, unknown>>({});
  const [detail, setDetail] = useState<Content | null>(null);
  const [editing, setEditing] = useState<Content | null>(null);

  const allTags = Array.from(new Set(contents.flatMap((c) => c.tags)));

  const applyConds = (c: Content, sc: SortConds) => {
    if (sc.bookId && c.bookId !== sc.bookId) return false;
    if (sc.genre && c.genre !== sc.genre) return false;
    if (sc.tag && !c.tags.includes(sc.tag)) return false;
    if (sc.author && !c.author.includes(sc.author)) return false;
    return !c.archived;
  };

  const sortedContents = activeSort
    ? contents.filter((c) => {
        try {
          const sc: SortConds = JSON.parse(activeSort.conds || "{}");
          return applyConds(c, sc);
        } catch {
          return false;
        }
      })
    : [];

  const handleSaveSort = async () => {
    if (!newSortName.trim()) return;
    await onAddSort({ name: newSortName, conds });
    setNewSortName("");
    setConds({});
    setShowCreate(false);
  };

  return (
    <div className="space-y-4">
      {/* Sort List */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-xs text-white/30">{sorts.length}件のソート</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-xl text-sm hover:bg-amber-400/30 transition"
          >
            + 新規ソート
          </button>
        </div>

        {sorts.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <button
              onClick={() => setActiveSort(activeSort?.id === s.id ? null : s)}
              className={`flex-1 text-left px-4 py-3 rounded-xl border transition text-sm ${
                activeSort?.id === s.id
                  ? "bg-amber-400/10 border-amber-400/40 text-amber-400"
                  : "bg-white/3 border-white/8 text-white hover:bg-white/5"
              }`}
            >
              {s.name}
            </button>
            <button
              onClick={() => onDeleteSort(s.id)}
              className="text-white/20 hover:text-red-400 text-xs transition px-2"
            >削除</button>
          </div>
        ))}

        {sorts.length === 0 && (
          <div className="text-center py-8 text-white/20 text-sm">ソートがありません</div>
        )}
      </div>

      {/* Sort Result */}
      {activeSort && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-white/8" />
            <p className="text-xs text-amber-400/60">{activeSort.name} · {sortedContents.length}件</p>
            <div className="h-px flex-1 bg-white/8" />
          </div>
          {sortedContents.map((c) => (
            <button
              key={c.id}
              onClick={() => setDetail(c)}
              className="w-full text-left bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-amber-400/30 transition"
            >
              <p className="text-xs text-amber-400/60 mb-1">
                {c.bookTitle} · Ch.{String(c.chapter).padStart(2, "0")} HL.{String(c.headline).padStart(2, "0")}
              </p>
              <p className="text-white text-sm line-clamp-2">{c.contents || c.title}</p>
            </button>
          ))}
          {sortedContents.length === 0 && (
            <p className="text-center text-white/20 text-sm py-8">該当するコンテンツがありません</p>
          )}
        </div>
      )}

      {/* Create Sort Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full sm:max-w-md bg-[#0f1117] border border-white/10 rounded-t-3xl sm:rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold">新規ソートを作成</h3>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
              placeholder="ソート名"
              value={newSortName}
              onChange={(e) => setNewSortName(e.target.value)}
            />
            <p className="text-xs text-white/40">絞り込み条件</p>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none"
              value={conds.bookId ?? ""}
              onChange={(e) => setConds((c) => ({ ...c, bookId: e.target.value || undefined }))}
            >
              <option value="">書籍: すべて</option>
              {books.map((b) => <option key={b.bookId} value={b.bookId}>{b.title}</option>)}
            </select>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none"
              value={conds.genre ?? ""}
              onChange={(e) => setConds((c) => ({ ...c, genre: e.target.value || undefined }))}
            >
              <option value="">ジャンル: すべて</option>
              {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none"
              value={conds.tag ?? ""}
              onChange={(e) => setConds((c) => ({ ...c, tag: e.target.value || undefined }))}
            >
              <option value="">タグ: すべて</option>
              {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition">キャンセル</button>
              <button onClick={handleSaveSort} disabled={!newSortName.trim()} className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-semibold text-sm hover:bg-amber-300 transition disabled:opacity-50">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {detail && (
        <DetailModal
          content={detail}
          books={books}
          allContents={contents}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setDetail(null); }}
          onArchive={() => { onArchive(detail.id, !detail.archived); setDetail(null); }}
        />
      )}
      {editing && (
        <ContentModal
          books={books}
          genres={genres}
          allContents={contents}
          editing={editing}
          onClose={() => setEditing(null)}
          onSave={async () => {}}
          onUpdate={async (pageId, data) => { await onUpdate(pageId, data); setEditing(null); }}
        />
      )}
    </div>
  );
}
