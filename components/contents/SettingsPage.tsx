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
      <div className="flex gap-2">
        {(["genre", "archive"] as SettingTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm transition border"
            style={tab === t
              ? { background: "var(--amber)", color: "#fff", borderColor: "var(--amber)" }
              : { background: "var(--surface)", color: "var(--text-muted)", borderColor: "var(--border)" }}>
            {t === "genre" ? "ジャンル管理" : `アーカイブ (${archived.length})`}
          </button>
        ))}
      </div>

      {tab === "genre" && (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>
            ジャンルは書籍登録時に自動的に追加されます。
          </p>
          <div className="space-y-2">
            {genres.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-faint)" }}>ジャンルがありません</p>}
            {genres.map((g) => {
              const count = contents.filter((c) => c.genre === g && !c.archived).length;
              return (
                <div key={g} className="flex items-center justify-between px-4 py-3 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <span className="text-sm" style={{ color: "var(--text)" }}>{g}</span>
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>{count}件</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "archive" && (
        <div className="space-y-3">
          {archived.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-faint)" }}>アーカイブはありません</p>}
          {archived.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl px-4 py-3 border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <button onClick={() => setDetail(c)} className="flex-1 text-left">
                <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{c.title}</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>{c.bookTitle}</p>
              </button>
              <button onClick={() => onArchive(c.id, false)}
                className="px-3 py-1.5 rounded-lg text-xs border flex-shrink-0"
                style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>
                復元
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="pt-6 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => { if (confirm("ログアウトしますか？")) window.location.href = "/api/auth/logout"; }}
          className="w-full py-3 rounded-xl text-sm border"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
          ログアウト
        </button>
      </div>

      {detail && (
        <DetailModal content={detail} books={books} allContents={contents}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setDetail(null); }}
          onArchive={() => { onArchive(detail.id, !detail.archived); setDetail(null); }} />
      )}
      {editing && (
        <ContentModal books={books} genres={genres} allContents={contents} editing={editing}
          onClose={() => setEditing(null)} onSave={async () => {}}
          onUpdate={async (pageId, data, keepOpen) => { await onUpdate(pageId, data); if (!keepOpen) setEditing(null); }} />
      )}
    </div>
  );
}
