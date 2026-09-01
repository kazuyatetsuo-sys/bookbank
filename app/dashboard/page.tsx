"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useBookBank, Content, Book } from "@/hooks/useBookBank";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import ContentModal from "@/components/contents/ContentModal";
import ContentPanel, { PanelMode } from "@/components/contents/ContentPanel";
import BookList from "@/components/books/BookList";
import SortPage from "@/components/contents/SortPage";
import SettingsPage from "@/components/contents/SettingsPage";

type Tab = "history" | "books" | "random" | "sortlist" | "sort";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const bank = useBookBank();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => (searchParams.get("book") || searchParams.get("content")) ? "books" : "random");
  const [showAdd, setShowAdd] = useState(false);
  const [historyDetail, setHistoryDetail] = useState<Content | null>(null);
  const [historyPanelMode, setHistoryPanelMode] = useState<PanelMode>("view");
  const [randomContents, setRandomContents] = useState<Content[]>([]);
  const [randomDetail, setRandomDetail] = useState<Content | null>(null);
  const [randomPanelMode, setRandomPanelMode] = useState<PanelMode>("view");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const historySwipeBack = useSwipeBack(() => setHistoryDetail(null));
  const randomSwipeBack = useSwipeBack(() => setRandomDetail(null));

  const activeContents = bank.contents.filter(c => !c.archived);

  const pickRandom = useCallback(() => {
    if (!activeContents.length) return;
    if (activeContents.length === 1) {
      setRandomContents([activeContents[0]]);
      setRandomDetail(activeContents[0]);
      setRandomPanelMode("view");
      return;
    }
    const shuffled = [...activeContents].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 2);
    setRandomContents(picked);
    setRandomDetail(picked[0] ?? null);
    setRandomPanelMode("view");
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
    { id: "sortlist" as Tab, label: "Sort List", icon: "☰"  },
    { id: "sort" as Tab,     label: "Sort",      icon: "⚡" },
  ];

  const p = (n: number) => String(n).padStart(2, "0");

  const goToBook = (book: Book) => {
    setHistoryDetail(null);
    setRandomDetail(null);
    setTab("books");
    setSelectedBook(book);
  };

  const historyListView = (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: "var(--text-faint)" }}>{filteredHistory.length}件</p>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-faint)" }}>🔍</span>
        <input className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
          placeholder="検索…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>
      <div>
        {filteredHistory.map(c => (
          <button key={c.id} onClick={() => { setHistoryDetail(c); setHistoryPanelMode("view"); }}
            className="w-full text-left pl-3 pr-1 py-3.5 transition hover:opacity-70"
            style={{
              borderLeft: historyDetail?.id === c.id ? "3px solid var(--amber)" : "3px solid transparent",
              borderBottom: "1px solid var(--border)",
            }}>
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
      </div>
      {filteredHistory.length === 0 && <p className="text-center py-16 text-sm" style={{ color: "var(--text-faint)" }}>コンテンツがありません</p>}
    </div>
  );

  const historyPanel = (fullHeight: boolean) => (
    <ContentPanel fullHeight={fullHeight} content={historyDetail} mode={historyPanelMode}
      books={bank.books} genres={bank.genres} allContents={bank.contents}
      onModeChange={setHistoryPanelMode}
      onUpdate={async (pageId, data) => {
        await bank.updateContent(pageId, data);
        setHistoryDetail(prev => prev && prev.id === pageId ? { ...prev, ...data } as Content : prev);
      }}
      onAdd={bank.addContent}
      onArchive={async (pageId, archived) => {
        await bank.archiveContent(pageId, archived);
        setHistoryDetail(prev => prev && prev.id === pageId ? { ...prev, archived } : prev);
      }}
      onBookClick={goToBook} />
  );

  const randomListView = (
    <div className="space-y-3">
      <p className="text-xs" style={{ color: "var(--text-faint)" }}>{activeContents.length}件からランダム</p>
      <div>
        {randomContents.map(rc => (
          <button key={rc.id} onClick={() => { setRandomDetail(rc); setRandomPanelMode("view"); }}
            className="w-full text-left pl-3 pr-1 py-3.5 transition hover:opacity-70"
            style={{
              borderLeft: randomDetail?.id === rc.id ? "3px solid var(--amber)" : "3px solid transparent",
              borderBottom: "1px solid var(--border)",
            }}>
            <p className="text-xs mb-1.5" style={{ color: "var(--amber)" }}>{rc.bookTitle} · Ch.{p(rc.chapter)} · HL.{p(rc.headline)} · #{rc.order}</p>
            <p className="text-sm leading-snug line-clamp-3 whitespace-pre-wrap" style={{ color: "var(--text)" }}>{rc.contents}</p>
            {rc.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {rc.tags.slice(0, 3).map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full text-xs border"
                    style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>{t}</span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
      {randomContents.length === 0 && <p className="text-center py-16 text-sm" style={{ color: "var(--text-faint)" }}>コンテンツがありません</p>}
    </div>
  );

  const randomPanel = (fullHeight: boolean) => (
    <ContentPanel fullHeight={fullHeight} content={randomDetail} mode={randomPanelMode}
      books={bank.books} genres={bank.genres} allContents={bank.contents}
      onModeChange={setRandomPanelMode}
      onUpdate={async (pageId, data) => {
        await bank.updateContent(pageId, data);
        setRandomDetail(prev => prev && prev.id === pageId ? { ...prev, ...data } as Content : prev);
      }}
      onAdd={bank.addContent}
      onArchive={async (pageId, archived) => {
        await bank.archiveContent(pageId, archived);
        setRandomDetail(prev => prev && prev.id === pageId ? { ...prev, archived } : prev);
      }}
      onBookClick={goToBook} />
  );

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
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "books") setSelectedBook(null); }}
              className="flex-shrink-0 flex flex-col items-center gap-0.5 px-5 py-2.5 text-xs border-b-2 transition-all"
              style={tab === t.id ? { borderColor: "var(--amber)", color: "var(--amber)" } : { borderColor: "transparent", color: "var(--text-muted)" }}>
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <main className={`mx-auto px-4 py-5 pb-24 ${tab === "books" || tab === "history" || tab === "random" ? "max-w-2xl md:max-w-none" : "max-w-2xl"}`}>
        {tab === "history" && (
          isDesktop ? (
            <div className="flex" style={{ height: "75vh" }}>
              <div className="w-1/2 min-w-0 overflow-y-auto overscroll-contain border-r py-1 pr-4" style={{ borderColor: "var(--border)" }}>
                {historyListView}
              </div>
              <div className="w-1/2 min-w-0 pl-4">{historyPanel(true)}</div>
            </div>
          ) : historyDetail ? (
            <div onTouchStart={historySwipeBack.onTouchStart} onTouchEnd={historySwipeBack.onTouchEnd}>
              <button onClick={() => setHistoryDetail(null)} className="flex items-center gap-1 text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                ← 戻る
              </button>
              {historyPanel(false)}
            </div>
          ) : historyListView
        )}

        {tab === "books" && (
          <BookList books={bank.books} genres={bank.genres} contents={bank.contents}
            onAdd={bank.addBook} onUpdate={bank.updateBook} onDelete={bank.deleteBook}
            onUpdateContent={bank.updateContent} onArchiveContent={bank.archiveContent}
            onAddContent={bank.addContent} allContents={bank.contents}
            selectedBook={selectedBook} onSelectBook={setSelectedBook} />
        )}

        {tab === "random" && (
          isDesktop ? (
            <div className="flex" style={{ height: "75vh" }}>
              <div className="w-1/2 min-w-0 overflow-y-auto overscroll-contain border-r py-1 pr-4" style={{ borderColor: "var(--border)" }}>
                {randomListView}
              </div>
              <div className="w-1/2 min-w-0 pl-4">{randomPanel(true)}</div>
            </div>
          ) : randomDetail ? (
            <div onTouchStart={randomSwipeBack.onTouchStart} onTouchEnd={randomSwipeBack.onTouchEnd}>
              <button onClick={() => setRandomDetail(null)} className="flex items-center gap-1 text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                ← 戻る
              </button>
              {randomPanel(false)}
            </div>
          ) : randomListView
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

      <button onClick={() => { setTab("random"); pickRandom(); }}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full text-2xl shadow-xl flex items-center justify-center transition hover:scale-105 active:scale-95"
        style={{ background: "var(--surface)", border: "2px solid var(--border)", color: "var(--text-muted)" }}>🎲</button>

      <button onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full text-2xl font-bold shadow-xl flex items-center justify-center transition hover:scale-105 active:scale-95"
        style={{ background: "var(--amber)", color: "#fff" }}>+</button>

      {showAdd && (
        <ContentModal books={bank.books} genres={bank.genres} allContents={bank.contents}
          onClose={() => setShowAdd(false)}
          onSave={async (data) => { await bank.addContent(data); }} />
      )}
    </div>
  );
}
