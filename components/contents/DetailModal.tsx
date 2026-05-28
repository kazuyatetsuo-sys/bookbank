"use client";
import { Content, Book } from "@/hooks/useBookBank";

interface Props {
  content: Content;
  books: Book[];
  allContents: Content[];
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
}

export default function DetailModal({ content, books, allContents, onClose, onEdit, onArchive }: Props) {
  const relItems = content.relIds
    ? content.relIds.split(",").filter(Boolean).map((id) => allContents.find((c) => c.id === id)).filter(Boolean) as Content[]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-2xl bg-[#0f1117] border border-white/10 rounded-t-3xl sm:rounded-2xl overflow-y-auto max-h-[90vh] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-amber-400/70 mb-1">
              {content.bookTitle} &nbsp;·&nbsp;
              Ch.{String(content.chapter).padStart(2, "0")} &nbsp;·&nbsp;
              HL.{String(content.headline).padStart(2, "0")}
            </p>
            <h2 className="text-white font-semibold text-lg leading-tight">{content.title}</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none flex-shrink-0">×</button>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2">
          {content.genre && (
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/60 rounded-full text-xs">{content.genre}</span>
          )}
          {content.author && (
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/60 rounded-full text-xs">✍ {content.author}</span>
          )}
          {content.tags.map((t) => (
            <span key={t} className="px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-full text-xs">{t}</span>
          ))}
        </div>

        {/* Contents */}
        {content.contents && (
          <div>
            <p className="text-xs text-white/40 mb-2">Contents</p>
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap bg-white/3 rounded-xl p-4">{content.contents}</p>
          </div>
        )}

        {/* Memo */}
        {content.memo && (
          <div>
            <p className="text-xs text-white/40 mb-2">メモ</p>
            <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap bg-white/3 rounded-xl p-4">{content.memo}</p>
          </div>
        )}

        {/* Related */}
        {relItems.length > 0 && (
          <div>
            <p className="text-xs text-white/40 mb-2">関連アイテム</p>
            <div className="space-y-2">
              {relItems.map((r) => (
                <div key={r.id} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/60">
                  {r.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <p className="text-xs text-white/20">
          作成: {content.createdAt ? new Date(content.createdAt).toLocaleDateString("ja-JP") : "—"}
          　更新: {content.updatedAt ? new Date(content.updatedAt).toLocaleDateString("ja-JP") : "—"}
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onArchive}
            className="px-4 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition text-sm"
          >
            {content.archived ? "復元" : "アーカイブ"}
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-semibold hover:bg-amber-300 transition text-sm"
          >
            編集
          </button>
        </div>
      </div>
    </div>
  );
}
