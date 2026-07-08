"use client";
import { useState, useEffect, useCallback } from "react";
import { useBookBank, Content, Book } from "@/hooks/useBookBank";
import ContentModal from "@/components/contents/ContentModal";
import DetailModal from "@/components/contents/DetailModal";
import BookList from "@/components/books/BookList";
import SortPage from "@/components/contents/SortPage";
import SettingsPage from "@/components/contents/SettingsPage";

type Tab = "history" | "books" | "random" | "sortlist" | "sort";

export default function Dashboard() {
  const bank = useBookBank();
  const [tab, setTab] = useState<Tab>("random");
  const [showAdd, setShowAdd] = useState(false);
  const [historyDetail, setHistoryDetail] = useState<Content | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [randomContents, setRandomContents] = useState<Content[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const activeContents = bank.contents.filter(c => !c.archived);

  const pickRandom = useCallback(() => {
    if (!activeContents.length) return;
    if (activeContents.length === 1) {
      setRandomContents([activeContents[0]]);
      return;
    }
    const shuffled = [...activeContents].sort(() => Math.random() - 0.5);
    setRandomContents(shuffled.slice(0, 2));
  }, [activeContents]);

  useEffect(() => {
    if (tab === "random" && randomContents.length === 0 && activeContents.length > 0) {
      pickRandom();
    }
  }, [tab, activeContents.length]);

  const filteredHistory = bank.history.filter(c =>
    !searchQuery || c.contents.includes(searchQuery) || c.bookTitle.includes(searchQuery) || c.memo.includes(searchQuery)
  );

  const tabs = [
    { id: "history" as Tab,  label: "History",   icon: "🕐" },
    { id: "books" as Tab,    label: "Books",     icon: "📚" },
    { id: "random" as Tab,   label: "Random",    icon: "🎲" },
    { id: "sortlist" as Tab, label: "Sort List", icon: "☰"  },
    { id: "sort" as Tab,     label: "Sort",      icon: "⚡" },
  ];

  const p = (n: number) => String(n).padStart(2, "0");

  const goToBook = (book: Book) => {
    setHistoryDetail(null);
    setTab("books");
    setSelectedBook(book);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header className="sticky top-0 z-40 border-b px-4 py-3" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: "var(--amber)", color: "#fff" }}>B</div>
            <span className="font-semibold text-sm">Book Bank</span>
          </div>
          {bank.loading && <span className="text-xs animate-pulse" style={{ color: "var(--text-faint)" }}>同期中…</span>}
        </div>
      </header>

      <nav className="sticky top-[49px] z-30 border-b overflow-x-auto" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto flex">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-5 py-2.5 text-xs border-b-2 transition-all"
              style={tab === t.id ? { borderColor: "var(--amber)", color: "var(--amber)" } : { borderColor: "transparent", color: "var(--text-muted)" }}>
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-24">
        {tab === "history" && (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>{filteredHistory.length}件</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-faint)" }}>🔍</span>
              <input className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                placeholder="検索…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            {filteredHistory.map(c => (
              <button key={c.id} onClick={() => setHistoryDetail(c)}
                className="w-full text-left px-4 py-3.5 rounded-xl transition hover:opacity-80 border"
                style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
                <p className="text-sm leading-snug mb-1.5 line-clamp-2 whitespace-pre-wrap" style={{ color: "var(--text)" }}>{c.contents || c.title}</p>
                {c.memo && <p className="text-xs line-clamp-1" style={{ color: "var(--text-muted)" }}>{c.memo}</p>}
                {c.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {c.tags.slice(0, 3).map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-xs border"
                        style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>{t}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
            {filteredHistory.length === 0 && <p className="text-center py-16 text-sm" style={{ color: "var(--text-faint)" }}>コンテンツがありません</p>}
          </div>
        )}

        {tab === "books" && (
          <BookList books={bank.books} genres={bank.genres} contents={bank.contents}
            onAdd={bank.addBook} onUpdate={bank.updateBook} onDelete={bank.deleteBook}
            onUpdateContent={bank.updateContent} onArchiveContent={bank.archiveContent} allContents={bank.contents}
            selectedBook={selectedBook} onSelectBook={setSelectedBook} />
        )}

        {tab === "random" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{activeContents.length}件からランダム</p>
              <button onClick={pickRandom} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                🔀 シャッフル
              </button>
            </div>
            {randomContents.map(rc => (
              <div key={rc.id} className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
                <div className="p-5">
                  <p className="text-xs mb-2" style={{ color: "var(--amber)" }}>
                    {rc.bookTitle} · Ch.{p(rc.chapter)} · HL.{p(rc.headline)}
                  </p>
                  <p className="text-base leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: "var(--text)" }}>{rc.contents}</p>
                  {rc.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {rc.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-xs border"
                          style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                {rc.memo && (
                  <div className="px-5 pb-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>メモ</p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>{rc.memo}</p>
                  </div>
                )}
                <div className="flex items-center justify-end px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <button onClick={() => setHistoryDetail(rc)} className="text-xs" style={{ color: "var(--amber)" }}>詳細を見る</button>
                </div>
              </div>
            ))}
            {randomContents.length === 0 && <p className="text-center py-16 text-sm" style={{ color: "var(--text-faint)" }}>コンテンツがありません</p>}
          </div>
        )}

        {tab === "sortlist" && (
          <SortPage sorts={bank.sorts} contents={bank.contents} books={bank.books} genres={bank.genres}
            onAddSort={bank.addSort} onDeleteSort={bank.deleteSort} onUpdate={bank.updateContent} onArchive={bank.archiveContent} />
        )}

        {tab === "sort" && (
          <SettingsPage contents={bank.contents} books={bank.books} genres={bank.genres}
            onArchive={bank.archiveContent} onUpdate={bank.updateContent} />
        )}
      </main>

      <button onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full text-2xl font-bold shadow-xl flex items-center justify-center transition hover:scale-105 active:scale-95"
        style={{ background: "var(--amber)", color: "#fff" }}>+</button>

      {showAdd && (
        <ContentModal books={bank.books} genres={bank.genres} allContents={bank.contents}
          onClose={() => setShowAdd(false)}
          onSave={async (data) => { await bank.addContent(data); }} />
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
          onArchive={() => { bank.archiveContent(historyDetail.id, !historyDetail.archived); setHistoryDetail(null); }}
          onBookClick={goToBook} />
      )}
    </div>
  );
}
