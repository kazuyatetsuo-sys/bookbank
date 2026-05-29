"use client";
import { useState, useEffect, useCallback } from "react";
import { useBookBank } from "@/hooks/useBookBank";
import { Content } from "@/hooks/useBookBank";
import ContentModal from "@/components/contents/ContentModal";
import DetailModal from "@/components/contents/DetailModal";
import BookList from "@/components/books/BookList";
import SortPage from "@/components/contents/SortPage";
import SettingsPage from "@/components/contents/SettingsPage";

type Tab = "history" | "books" | "random" | "sort" | "settings";

export default function Dashboard() {
  const bank = useBookBank();
  const [tab, setTab] = useState<Tab>("history");
  const [showAdd, setShowAdd] = useState(false);
  const [historyDetail, setHistoryDetail] = useState<Content | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [randomContent, setRandomContent] = useState<Content | null>(null);
  const [randomDetail, setRandomDetail] = useState<Content | null>(null);

  const pickRandom = useCallback(() => {
    const pool = bank.contents.filter((c) => !c.archived);
    if (!pool.length) return;
    setRandomContent(pool[Math.floor(Math.random() * pool.length)]);
  }, [bank.contents]);

  useEffect(() => {
    if (tab === "random" && !randomContent && bank.contents.length > 0) {
      pickRandom();
    }
  }, [tab, bank.contents.length, randomContent, pickRandom]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "history", label: "履歴", icon: "🕐" },
    { id: "books",   label: "書籍", icon: "📚" },
    { id: "random",  label: "Random", icon: "🎲" },
    { id: "sort",    label: "ソート", icon: "🔍" },
    { id: "settings",label: "設定",  icon: "⚙️" },
  ];

  const p = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40  backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">📖</span>
            <h1 className="text-white font-semibold tracking-tight">Book Bank</h1>
          </div>
          {bank.loading && <span className="text-xs text-white/30 animate-pulse">同期中…</span>}
        </div>
      </header>

      <nav className="sticky top-[57px] z-30  backdrop-blur border-b border-white/5 overflow-x-auto">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition ${
                tab === t.id ? "border-amber-400 text-amber-400" : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              <span className="text-base">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {tab === "history" && (
          <div className="space-y-3">
            <p className="text-xs text-white/30">最近のコンテンツ（{bank.history.length}件）</p>
            {bank.history.map((c) => (
              <button key={c.id} onClick={() => setHistoryDetail(c)}
                className="w-full text-left bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-amber-400/30 hover:bg-white/5 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-400/60 mb-1">{c.bookTitle} · Ch.{p(c.chapter)} HL.{p(c.headline)}</p>
                    <p className="text-white text-sm line-clamp-2">{c.contents || c.title}</p>
                    {c.memo && <p className="text-white/40 text-xs line-clamp-1 mt-1">{c.memo}</p>}
                  </div>
                  <p className="text-white/20 text-xs flex-shrink-0">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("ja-JP", { month: "short", day: "numeric" }) : ""}
                  </p>
                </div>
                {c.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {c.tags.slice(0, 3).map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded-full text-xs">{t}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
            {bank.history.length === 0 && <div className="text-center py-16 text-white/20 text-sm">まだコンテンツがありません</div>}
          </div>
        )}

        {tab === "books" && (
          <BookList books={bank.books} genres={bank.genres} contents={bank.contents}
            onAdd={bank.addBook} onUpdate={bank.updateBook} onDelete={bank.deleteBook} />
        )}

        {tab === "random" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/30">ランダムピック · {bank.contents.filter(c => !c.archived).length}件から</p>
              <button onClick={pickRandom}
                className="px-4 py-2 bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-xl text-sm hover:bg-amber-400/30 transition active:scale-95">
                🎲 次へ
              </button>
            </div>
            {randomContent ? (
              <div className="space-y-4">
                <button onClick={() => setRandomDetail(randomContent)}
                  className="w-full text-left bg-white/3 border border-amber-400/20 rounded-2xl p-6 hover:border-amber-400/40 transition">
                  <p className="text-xs text-amber-400/60 mb-3">{randomContent.bookTitle} · Ch.{p(randomContent.chapter)} HL.{p(randomContent.headline)}</p>
                  <p className="text-white text-base leading-relaxed">{randomContent.contents}</p>
                  {randomContent.memo && <p className="text-white/40 text-sm mt-4 border-t border-white/5 pt-4">{randomContent.memo}</p>}
                  {randomContent.tags.length > 0 && (
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {randomContent.tags.map((t) => <span key={t} className="px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded-full text-xs">{t}</span>)}
                    </div>
                  )}
                  <p className="text-xs text-white/20 mt-4">タップして詳細 →</p>
                </button>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { v: bank.contents.filter(c => !c.archived).length, label: "コンテンツ" },
                    { v: bank.books.length, label: "書籍" },
                    { v: bank.genres.length, label: "ジャンル" },
                  ].map(({ v, label }) => (
                    <div key={label} className="bg-white/3 border border-white/8 rounded-xl py-3">
                      <p className="text-lg font-semibold text-amber-400">{v}</p>
                      <p className="text-xs text-white/30 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-white/20 text-sm">
                {bank.loading ? "読み込み中…" : "コンテンツがありません"}
              </div>
            )}
          </div>
        )}

        {tab === "sort" && (
          <SortPage sorts={bank.sorts} contents={bank.contents} books={bank.books} genres={bank.genres}
            onAddSort={bank.addSort} onDeleteSort={bank.deleteSort} onUpdate={bank.updateContent} onArchive={bank.archiveContent} />
        )}

        {tab === "settings" && (
          <SettingsPage contents={bank.contents} books={bank.books} genres={bank.genres}
            onArchive={bank.archiveContent} onUpdate={bank.updateContent} />
        )}
      </main>

      <button onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-amber-400 text-black rounded-full text-2xl font-bold shadow-lg shadow-amber-400/30 hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all flex items-center justify-center">
        +
      </button>

      {showAdd && (
        <ContentModal books={bank.books} genres={bank.genres} allContents={bank.contents}
          onClose={() => setShowAdd(false)}
          onSave={async (data) => { const ok = await bank.addContent(data); if (ok) setShowAdd(false); return ok ?? false; }} />
      )}
      {editingContent && (
        <ContentModal books={bank.books} genres={bank.genres} allContents={bank.contents} editing={editingContent}
          onClose={() => setEditingContent(null)} onSave={async () => {}}
          onUpdate={async (pageId, data) => { await bank.updateContent(pageId, data); setEditingContent(null); }} />
      )}
      {historyDetail && (
        <DetailModal content={historyDetail} books={bank.books} allContents={bank.contents}
          onClose={() => setHistoryDetail(null)}
          onEdit={() => { setEditingContent(historyDetail); setHistoryDetail(null); }}
          onArchive={() => { bank.archiveContent(historyDetail.id, !historyDetail.archived); setHistoryDetail(null); }} />
      )}
      {randomDetail && (
        <DetailModal content={randomDetail} books={bank.books} allContents={bank.contents}
          onClose={() => setRandomDetail(null)}
          onEdit={() => { setEditingContent(randomDetail); setRandomDetail(null); }}
          onArchive={() => { bank.archiveContent(randomDetail.id, !randomDetail.archived); setRandomDetail(null); }} />
      )}
    </div>
  );
}
