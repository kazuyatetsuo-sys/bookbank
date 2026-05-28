"use client";
import { useState } from "react";
import { useBookBank } from "@/hooks/useBookBank";
import ContentList from "@/components/contents/ContentList";
import ContentModal from "@/components/contents/ContentModal";
import DetailModal from "@/components/contents/DetailModal";
import BookList from "@/components/books/BookList";
import SortPage from "@/components/contents/SortPage";
import SettingsPage from "@/components/contents/SettingsPage";

type Tab = "history" | "books" | "sortlist" | "sort" | "settings";

export default function Dashboard() {
  const bank = useBookBank();
  const [tab, setTab] = useState<Tab>("history");
  const [showAdd, setShowAdd] = useState(false);
  const [historyDetail, setHistoryDetail] = useState<ReturnType<typeof bank.history>[0] | null>(null);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "history", label: "履歴", icon: "🕐" },
    { id: "books", label: "書籍", icon: "📚" },
    { id: "sortlist", label: "ソート", icon: "📑" },
    { id: "sort", label: "ソート画面", icon: "🔍" },
    { id: "settings", label: "設定", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#080a0f]/90 backdrop-blur border-b border-white/5 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">📖</span>
            <h1 className="text-white font-semibold tracking-tight">Book Bank</h1>
          </div>
          {bank.loading && (
            <span className="text-xs text-white/30 animate-pulse">同期中…</span>
          )}
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="sticky top-[57px] z-30 bg-[#080a0f]/90 backdrop-blur border-b border-white/5 overflow-x-auto">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 transition ${
                tab === t.id
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              <span className="text-base">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* History Tab */}
        {tab === "history" && (
          <div className="space-y-3">
            <p className="text-xs text-white/30">最近のコンテンツ（{bank.history.length}件）</p>
            {bank.history.map((c) => (
              <button
                key={c.id}
                onClick={() => setHistoryDetail(c)}
                className="w-full text-left bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-amber-400/30 hover:bg-white/5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-400/60 mb-1">
                      {c.bookTitle} · Ch.{String(c.chapter).padStart(2, "0")} HL.{String(c.headline).padStart(2, "0")}
                    </p>
                    <p className="text-white text-sm line-clamp-2">{c.contents || c.title}</p>
                    {c.memo && (
                      <p className="text-white/40 text-xs line-clamp-1 mt-1">{c.memo}</p>
                    )}
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
            {bank.history.length === 0 && (
              <div className="text-center py-16 text-white/20 text-sm">まだコンテンツがありません</div>
            )}
          </div>
        )}

        {/* Books Tab */}
        {tab === "books" && (
          <BookList
            books={bank.books}
            genres={bank.genres}
            onAdd={bank.addBook}
            onUpdate={bank.updateBook}
            onDelete={bank.deleteBook}
          />
        )}

        {/* Sort List Tab */}
        {tab === "sortlist" && (
          <div className="space-y-3">
            <p className="text-xs text-white/30">{bank.sorts.length}件のソート</p>
            {bank.sorts.map((s) => {
              let condLabel = "";
              try {
                const sc = JSON.parse(s.conds || "{}");
                const parts = [];
                if (sc.bookId) {
                  const b = bank.books.find((b) => b.bookId === sc.bookId);
                  if (b) parts.push(b.title);
                }
                if (sc.genre) parts.push(sc.genre);
                if (sc.tag) parts.push(`#${sc.tag}`);
                condLabel = parts.join(" · ") || "すべて";
              } catch { condLabel = "—"; }
              return (
                <div key={s.id} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-2xl px-4 py-3">
                  <div className="flex-1">
                    <p className="text-white text-sm">{s.name}</p>
                    <p className="text-white/30 text-xs mt-0.5">{condLabel}</p>
                  </div>
                  <button
                    onClick={() => bank.deleteSort(s.id)}
                    className="text-white/20 hover:text-red-400 text-xs transition"
                  >削除</button>
                </div>
              );
            })}
            {bank.sorts.length === 0 && (
              <div className="text-center py-16 text-white/20 text-sm">ソートがありません</div>
            )}
          </div>
        )}

        {/* Sort Screen Tab */}
        {tab === "sort" && (
          <SortPage
            sorts={bank.sorts}
            contents={bank.contents}
            books={bank.books}
            genres={bank.genres}
            onAddSort={bank.addSort}
            onDeleteSort={bank.deleteSort}
            onUpdate={bank.updateContent}
            onArchive={bank.archiveContent}
          />
        )}

        {/* Settings Tab */}
        {tab === "settings" && (
          <SettingsPage
            contents={bank.contents}
            books={bank.books}
            genres={bank.genres}
            onArchive={bank.archiveContent}
            onUpdate={bank.updateContent}
          />
        )}
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-amber-400 text-black rounded-full text-2xl font-bold shadow-lg shadow-amber-400/30 hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        +
      </button>

      {/* Add Content Modal */}
      {showAdd && (
        <ContentModal
          books={bank.books}
          genres={bank.genres}
          allContents={bank.contents}
          onClose={() => setShowAdd(false)}
          onSave={async (data) => {
            const ok = await bank.addContent(data);
            if (ok) setShowAdd(false);
            return ok ?? false;
          }}
        />
      )}

      {/* History Detail Modal */}
      {historyDetail && (
        <DetailModal
          content={historyDetail}
          books={bank.books}
          allContents={bank.contents}
          onClose={() => setHistoryDetail(null)}
          onEdit={() => setHistoryDetail(null)}
          onArchive={() => { bank.archiveContent(historyDetail.id, !historyDetail.archived); setHistoryDetail(null); }}
        />
      )}
    </div>
  );
}
