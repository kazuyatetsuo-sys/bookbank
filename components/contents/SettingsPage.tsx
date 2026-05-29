"use client";
import { useState } from "react";
import { Content, Book } from "@/hooks/useBookBank";
import DetailModal from "../contents/DetailModal";
import ContentModal from "../contents/ContentModal";

interface Props {
  contents: Content[];
  books: Book[];
  genres: string[];
  onArchive: (pageId: string, archived: boolean) => Promise<void>;
  onUpdate: (pageId: string, data: Partial<Content>) => Promise<void>;
}

type SettingTab = "genre" | "archive";

export default function SettingsPage({ contents, books, genres, onArchive, onUpdate }: Props) {
  const [tab, setTab] = useState<SettingTab>("genre");
  const [detail, setDetail] = useState<Content | null>(null);
  const [editing, setEditing] = useState<Content | null>(null);

  const archived = contents.filter((c) => c.archived);

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="flex gap-2">
        {(["genre", "archive"] as SettingTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm transition ${tab === t ? "bg-amber-400 text-black font-semibold" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
          >
            {t === "genre" ? "ジャンル管理" : `アーカイブ (${archived.length})`}
          </button>
        ))}
      </div>

      {/* Genre Tab */}
      {tab === "genre" && (
        <div className="space-y-3">
          <p className="text-xs text-white/30">
            ジャンルは書籍登録時に自動的に追加されます。書籍のジャンルを編集することでジャンルを管理してください。
          </p>
          <div className="space-y-2">
            {genres.length === 0 && (
              <p className="text-white/20 text-sm text-center py-8">ジャンルがありません</p>
            )}
            {genres.map((g) => {
              const count = contents.filter((c) => c.genre === g && !c.archived).length;
              return (
                <div key={g} className="flex items-center justify-between px-4 py-3 bg-white/3 border border-white/8 rounded-xl">
                  <span className="text-white text-sm">{g}</span>
                  <span className="text-white/30 text-xs">{count}件</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Archive Tab */}
      {tab === "archive" && (
        <div className="space-y-3">
          {archived.length === 0 && (
            <p className="text-white/20 text-sm text-center py-8">アーカイブはありません</p>
          )}
          {archived.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3"
            >
              <button
                onClick={() => setDetail(c)}
                className="flex-1 text-left"
              >
                <p className="text-white/60 text-sm truncate">{c.title}</p>
                <p className="text-white/30 text-xs">{c.bookTitle}</p>
              </button>
              <button
                onClick={() => onArchive(c.id, false)}
                className="px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-lg text-xs hover:bg-amber-400/20 transition flex-shrink-0"
              >
                復元
              </button>
            </div>
          ))}
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
      <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
        <button onClick={() => { if (confirm("ログアウトしますか？")) window.location.href = "/api/auth/logout"; }}
          className="w-full py-3 rounded-xl text-sm border"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          ログアウト
        </button>
      </div>
      )}
    </div>
  );
}
