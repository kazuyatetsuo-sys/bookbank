"use client";
import { useState } from "react";
import { Content, Book } from "@/hooks/useBookBank";

interface Props {
  content: Content;
  books: Book[];
  allContents: Content[];
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onBookClick?: (book: Book) => void;
}

export default function DetailModal({ content, books, allContents, onClose, onEdit, onArchive, onBookClick }: Props) {
  const [stack, setStack] = useState<Content[]>([content]);
  const cur = stack[stack.length - 1];
  const book = books.find(b => b.bookId === cur.bookId);
  const p = (n: number) => String(n).padStart(2, "0");

  const relItems = cur.relIds
    ? cur.relIds.split(",").filter(Boolean).map(id => allContents.find(c => c.id === id)).filter(Boolean) as Content[]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full sm:max-w-lg rounded-2xl overflow-y-auto max-h-[90vh] border"
        style={{ background: "var(--bg2)", borderColor: "var(--border)", color: "var(--text)" }}
        onClick={e => e.stopPropagation()}>

        {stack.length > 1 && (
          <button onClick={() => setStack(s => s.slice(0, -1))}
            className="flex items-center gap-1 px-5 pt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            ← 戻る
          </button>
        )}

        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-medium leading-relaxed flex-1 whitespace-pre-wrap" style={{ color: "var(--text)" }}>{cur.contents}</p>
            <button onClick={onClose} className="text-xl flex-shrink-0" style={{ color: "var(--text-faint)" }}>×</button>
          </div>

          <button
            onClick={() => book && onBookClick?.(book)}
            disabled={!book || !onBookClick}
            className="flex items-center gap-2 text-left"
          >
            {book?.coverUrl && <img src={book.coverUrl} alt="" className="w-5 h-7 object-cover rounded" />}
            <p className="text-xs" style={{ color: "var(--amber)" }}>{cur.bookTitle} · Ch.{p(cur.chapter)} · HL.{p(cur.headline)}</p>
          </button>

          <div className="flex flex-wrap gap-1.5">
            {cur.author && <span className="px-2 py-0.5 rounded-full text-xs border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>✍ {cur.author}</span>}
            {cur.genre && <span className="px-2 py-0.5 rounded-full text-xs border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>{cur.genre}</span>}
            {cur.tags.map(t => <span key={t} className="px-2 py-0.5 rounded-full text-xs border" style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>{t}</span>)}
          </div>

          {cur.memo && (
            <div className="rounded-xl p-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>メモ</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>{cur.memo}</p>
            </div>
          )}

          {relItems.length > 0 && (
            <div>
              <p className="text-xs mb-2" style={{ color: "var(--text-faint)" }}>関連アイテム</p>
              <div className="space-y-1.5">
                {relItems.map(r => (
                  <button key={r.id} onClick={() => setStack(s => [...s, r])}
                    className="w-full text-left px-3 py-2.5 rounded-xl border transition hover:opacity-70"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <p className="text-xs mb-0.5" style={{ color: "var(--amber)" }}>{r.bookTitle} · Ch.{p(r.chapter)} HL.{p(r.headline)} →</p>
                    <p className="text-sm line-clamp-2" style={{ color: "var(--text-muted)" }}>{r.contents}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            作成: {cur.createdAt ? new Date(cur.createdAt).toLocaleDateString("ja-JP") : "—"}
          </p>
        </div>

        {stack.length === 1 && (
          <div className="flex gap-3 px-5 pb-5">
            <button onClick={onArchive} className="px-4 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
              {content.archived ? "復元" : "アーカイブ"}
            </button>
            <button onClick={onEdit} className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "var(--amber)", color: "#fff" }}>
              編集
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
