"use client";
import { useState } from "react";
import { Book, Content } from "@/hooks/useBookBank";
import DetailModal from "@/components/contents/DetailModal";
import ContentModal from "@/components/contents/ContentModal";

interface Props {
  books: Book[];
  genres: string[];
  contents?: Content[];
  allContents?: Content[];
  onAdd: (data: Omit<Book, "id" | "bookId" | "createdAt">) => Promise<void>;
  onUpdate: (pageId: string, data: Partial<Book>) => Promise<void>;
  onDelete: (pageId: string) => Promise<void>;
  onUpdateContent?: (pageId: string, data: Partial<Content>) => Promise<void>;
  onArchiveContent?: (pageId: string, archived: boolean) => Promise<void>;
  onAddContent?: (data: Omit<Content, "id" | "title" | "archived" | "createdAt" | "updatedAt">) => Promise<boolean>;
  selectedBook?: Book | null;
  onSelectBook?: (b: Book | null) => void;
}

type ChapterEntry = { num: string; title: string };

function parseChapterTitles(raw: string): ChapterEntry[] {
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {}
  return [];
}
function stringifyChapterTitles(e: ChapterEntry[]): string {
  return JSON.stringify(e.filter(x => x.num || x.title));
}
function toIsbn13(isbn: string): string {
  const c = isbn.replace(/[-\s]/g, "");
  if (c.length === 13) return c;
  const base = "978" + c.slice(0, 9);
  const sum = base.split("").reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);
  return base + String((10 - (sum % 10)) % 10);
}
async function fetchIsbn(isbn: string) {
  const c = toIsbn13(isbn.replace(/[-\s]/g, ""));
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${c}`);
    const data = await res.json();
    const item = data.items?.[0]?.volumeInfo;
    if (item) return { title: item.title, author: item.authors?.[0], coverUrl: item.imageLinks?.thumbnail?.replace("http://", "https://") };
  } catch {}
  try {
    const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${c}&format=json&jscmd=data`);
    const data = await res.json();
    const b = data[`ISBN:${c}`];
    if (b) return { title: b.title, author: b.authors?.[0]?.name, coverUrl: b.cover?.large || b.cover?.medium };
  } catch {}
  return {};
}

const inp = "w-full rounded-xl p-3 text-sm border focus:outline-none";
const inpStyle = { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" };
const overlay = "fixed inset-0 z-50 flex items-center justify-center";
const emptyForm = { title: "", author: "", genre: "", coverUrl: "", isbn: "", memo: "" };
const p = (n: number) => String(n).padStart(2, "0");

function ChapterList({ chapters, onChange }: { chapters: ChapterEntry[]; onChange: (c: ChapterEntry[]) => void }) {
  const move = (i: number, dir: number) => {
    const next = [...chapters]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <div>
      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>目次</p>
      <div className="space-y-2">
        {chapters.map((ch, i) => (
          <div key={i} className="flex gap-2 items-center rounded-lg px-2 py-1 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-xs leading-none px-1 disabled:opacity-30" style={{ color: "var(--text-faint)" }}>▲</button>
              <button onClick={() => move(i, 1)} disabled={i === chapters.length - 1} className="text-xs leading-none px-1 disabled:opacity-30" style={{ color: "var(--text-faint)" }}>▼</button>
            </div>
            <input className="w-10 rounded-lg p-2 text-sm border text-center focus:outline-none" style={inpStyle}
              value={ch.num} onChange={e => onChange(chapters.map((x, j) => j === i ? { ...x, num: e.target.value } : x))} placeholder="1" />
            <input className="flex-1 rounded-lg p-2 text-sm border focus:outline-none" style={inpStyle}
              value={ch.title} onChange={e => onChange(chapters.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="チャプタータイトル" />
            <button onClick={() => onChange(chapters.filter((_, j) => j !== i))} className="text-sm px-2" style={{ color: "var(--text-faint)" }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...chapters, { num: String(chapters.length + 1), title: "" }])}
        className="mt-2 text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>+ Chapterを追加</button>
    </div>
  );
}

export default function BookList({ books, genres, contents = [], allContents, onAdd, onUpdate, onDelete, onUpdateContent, onArchiveContent, onAddContent, selectedBook, onSelectBook }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [chapters, setChapters] = useState<ChapterEntry[]>([]);
  const [editing, setEditing] = useState<Book | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editChapters, setEditChapters] = useState<ChapterEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [internalSelected, setInternalSelected] = useState<Book | null>(null);
  const selected = selectedBook !== undefined ? selectedBook : internalSelected;
  const setSelected = onSelectBook || setInternalSelected;
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({});
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [detailContent, setDetailContent] = useState<Content | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [showAddContent, setShowAddContent] = useState(false);

  const lookup = async (isbn: string, isEdit = false) => {
    setIsbnLoading(true);
    const r = await fetchIsbn(isbn);
    if (isEdit) setEditForm(f => ({ ...f, ...r })); else setForm(f => ({ ...f, ...r }));
    setIsbnLoading(false);
  };
  const handleAdd = async () => {
    if (!form.title.trim()) return; setSaving(true);
    await onAdd({ title: form.title, author: form.author, genre: form.genre, coverUrl: form.coverUrl, memo: form.memo, chapterTitles: stringifyChapterTitles(chapters) });
    setForm({ ...emptyForm }); setChapters([]); setShowAdd(false); setSaving(false);
  };
  const handleUpdate = async () => {
    if (!editing) return; setSaving(true);
    await onUpdate(editing.id, { title: editForm.title, author: editForm.author, genre: editForm.genre, coverUrl: editForm.coverUrl, memo: editForm.memo, chapterTitles: stringifyChapterTitles(editChapters) });
    setEditing(null); setSaving(false);
  };
  const startEdit = (b: Book) => {
    setEditing(b);
    setEditForm({ title: b.title, author: b.author, genre: b.genre, coverUrl: b.coverUrl, isbn: "", memo: b.memo || "" });
    setEditChapters(parseChapterTitles(b.chapterTitles || ""));
  };

  const allGenres = [...new Set(books.map(b => b.genre || "未分類"))].sort();
  const displayBooks = selectedGenre
    ? books.filter(b => (b.genre || "未分類") === selectedGenre)
    : [...books].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>{books.length}冊</p>
        <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 rounded-lg text-sm border"
          style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>+ 書籍を追加</button>
      </div>

      {/* ジャンルチップ */}
      <div className="flex gap-2 flex-wrap">
        {["すべて", ...allGenres].map(g => (
          <button key={g} onClick={() => setSelectedGenre(g === "すべて" ? null : g === selectedGenre ? null : g)}
            className="px-3 py-1 rounded-full text-xs border transition"
            style={(g === "すべて" ? !selectedGenre : selectedGenre === g)
              ? { background: "var(--amber)", borderColor: "var(--amber)", color: "#fff" }
              : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            {g}
          </button>
        ))}
      </div>

      {/* 書籍一覧 */}
      <div className="space-y-2">
        {!selectedGenre && <p className="text-xs" style={{ color: "var(--text-faint)" }}>登録順</p>}
        {displayBooks.map(b => (
          <div key={b.id} onClick={() => { setSelected(b); setOpenChapters({}); }}
            className="flex gap-3 items-center px-4 py-3 rounded-xl border cursor-pointer transition hover:opacity-80"
            style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
            {b.coverUrl
              ? <img src={b.coverUrl} alt="" className="w-10 h-14 object-cover rounded-lg flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : <div className="w-10 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-lg" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>📖</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{b.title}</p>
              {b.author && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{b.author}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={e => { e.stopPropagation(); startEdit(b); }} className="text-xs" style={{ color: "var(--text-muted)" }}>編集</button>
              <button onClick={e => { e.stopPropagation(); onDelete(b.id); }} className="text-xs hover:text-red-400" style={{ color: "var(--text-faint)" }}>削除</button>
            </div>
          </div>
        ))}
        {books.length === 0 && <p className="text-center py-12 text-sm" style={{ color: "var(--text-faint)" }}>書籍が登録されていません</p>}
      </div>

      {/* Book Detail */}
      {selected && (
        <div className={overlay} style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setSelected(null)}>
          <div className="w-full sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto border m-4"
            style={{ background: "var(--bg2)", borderColor: "var(--border)" }} onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-start gap-3 mb-5">
                {selected.coverUrl
                  ? <img src={selected.coverUrl} alt="" className="w-14 h-20 object-cover rounded-xl flex-shrink-0" />
                  : <div className="w-14 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>📖</div>
                }
                <div className="flex-1">
                  <h2 className="font-semibold text-base leading-tight" style={{ color: "var(--text)" }}>{selected.title}</h2>
                  {selected.author && <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{selected.author}</p>}
                  {selected.genre && <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs border" style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>{selected.genre}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setShowAddContent(true)} className="px-3 py-1.5 rounded-lg text-xs border"
                    style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>+ 追加</button>
                  <button onClick={() => setSelected(null)} className="text-xl" style={{ color: "var(--text-faint)" }}>×</button>
                </div>
              </div>

              {selected.memo && (
                <div className="mb-4 p-3 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>📝 メモ</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{selected.memo}</p>
                </div>
              )}

              {(() => {
                const bc = contents.filter(c => !c.archived && c.bookId === selected.bookId)
                  .sort((a, b) => a.chapter - b.chapter || a.headline - b.headline || (a.order != null && b.order != null ? a.order - b.order : a.order != null ? -1 : b.order != null ? 1 : new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()));
                const chs = [...new Set(bc.map(c => c.chapter))].sort((a, b) => a - b);
                const chapterTitleMap: Record<string, string> = {};
                parseChapterTitles(selected.chapterTitles || "").forEach(e => { chapterTitleMap[e.num] = e.title; });
                if (!bc.length) return <p className="text-sm text-center py-8" style={{ color: "var(--text-faint)" }}>コンテンツがありません</p>;
                return (
                  <div className="space-y-1.5">
                    <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>目次</p>
                    {chs.map(ch => {
                      const chContents = bc.filter(c => c.chapter === ch);
                      const isOpen = openChapters[ch];
                      const chTitle = chapterTitleMap[String(ch)] || "";
                      const headlines = [...new Set(chContents.map(c => c.headline))].sort((a, b) => a - b);
                      return (
                        <div key={ch}>
                          <button onClick={() => setOpenChapters(prev => ({ ...prev, [ch]: !prev[ch] }))}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition hover:opacity-70"
                            style={{ background: "var(--surface)" }}>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold" style={{ color: "var(--amber)" }}>Ch.{p(ch)}</span>
                              <span className="text-sm" style={{ color: "var(--text)" }}>{chTitle || `Chapter ${p(ch)}`}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{chContents.length}件</span>
                              <span className="text-xs" style={{ color: "var(--text-faint)" }}>{isOpen ? "▲" : "▼"}</span>
                            </div>
                          </button>
                          {isOpen && (
                            <div className="mt-1 pl-2 space-y-3">
                              {headlines.map(hl => {
                                const hlContents = chContents.filter(c => c.headline === hl);
                                return (
                                  <div key={hl}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-xs font-mono" style={{ color: "var(--amber)" }}>HL.{p(hl)}</span>
                                      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                                    </div>
                                    <div className="space-y-1.5">
                                      {hlContents.map((c, idx) => (
                                        <button key={c.id} onClick={() => setDetailContent(c)}
                                          className="w-full text-left px-3 py-2.5 rounded-lg border transition hover:opacity-70"
                                          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                                          <div className="flex items-start gap-2">
                                            <span className="text-xs flex-shrink-0 mt-0.5 font-mono" style={{ color: "var(--text-faint)" }}>#{idx + 1}</span>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{c.contents}</p>
                                              {c.memo && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{c.memo}</p>}
                                              {c.tags.length > 0 && (
                                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                                  {c.tags.map(t => <span key={t} className="px-1.5 py-0.5 rounded-full text-xs border" style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>{t}</span>)}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showAdd && (
        <div className={overlay} style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowAdd(false)}>
          <div className="w-full sm:max-w-md rounded-2xl p-5 space-y-3 border max-h-[90vh] overflow-y-auto m-4"
            style={{ background: "var(--bg2)", borderColor: "var(--border)" }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>書籍を追加</h3>
            <div className="flex gap-2">
              <input className={`flex-1 ${inp}`} style={inpStyle} placeholder="ISBN" value={form.isbn}
                onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} onKeyDown={e => e.key === "Enter" && lookup(form.isbn)} />
              <button onClick={() => lookup(form.isbn)} disabled={isbnLoading || !form.isbn.trim()}
                className="px-3 rounded-xl text-sm border disabled:opacity-40" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                {isbnLoading ? "…" : "取得"}
              </button>
            </div>
            <input className={inp} style={inpStyle} placeholder="タイトル *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input className={inp} style={inpStyle} placeholder="著者" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
            <input className={inp} style={inpStyle} placeholder="表紙URL" value={form.coverUrl} onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))} />
            <input className={inp} style={inpStyle} placeholder="ジャンル" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} />
            <textarea className={`${inp} h-20 resize-none`} style={inpStyle} placeholder="書籍メモ" value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} />
            <ChapterList chapters={chapters} onChange={setChapters} />
            {form.coverUrl && <div className="flex justify-center"><img src={form.coverUrl} alt="" className="h-20 object-cover rounded-lg" /></div>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>キャンセル</button>
              <button onClick={handleAdd} disabled={saving || !form.title.trim()} className="flex-1 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50" style={{ background: "var(--amber)", color: "#fff" }}>{saving ? "保存中…" : "追加"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {editing && (
        <div className={overlay} style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setEditing(null)}>
          <div className="w-full sm:max-w-md rounded-2xl p-5 space-y-3 border max-h-[90vh] overflow-y-auto m-4"
            style={{ background: "var(--bg2)", borderColor: "var(--border)" }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>書籍を編集</h3>
            <div className="flex gap-2">
              <input className={`flex-1 ${inp}`} style={inpStyle} placeholder="ISBN" value={editForm.isbn}
                onChange={e => setEditForm(f => ({ ...f, isbn: e.target.value }))} onKeyDown={e => e.key === "Enter" && lookup(editForm.isbn, true)} />
              <button onClick={() => lookup(editForm.isbn, true)} disabled={isbnLoading || !editForm.isbn.trim()}
                className="px-3 rounded-xl text-sm border disabled:opacity-40" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                {isbnLoading ? "…" : "取得"}
              </button>
            </div>
            <input className={inp} style={inpStyle} placeholder="タイトル *" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
            <input className={inp} style={inpStyle} placeholder="著者" value={editForm.author} onChange={e => setEditForm(f => ({ ...f, author: e.target.value }))} />
            <input className={inp} style={inpStyle} placeholder="表紙URL" value={editForm.coverUrl} onChange={e => setEditForm(f => ({ ...f, coverUrl: e.target.value }))} />
            <input className={inp} style={inpStyle} placeholder="ジャンル" value={editForm.genre} onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))} />
            <textarea className={`${inp} h-20 resize-none`} style={inpStyle} placeholder="書籍メモ" value={editForm.memo} onChange={e => setEditForm(f => ({ ...f, memo: e.target.value }))} />
            <ChapterList chapters={editChapters} onChange={setEditChapters} />
            {editForm.coverUrl && <div className="flex justify-center"><img src={editForm.coverUrl} alt="" className="h-20 object-cover rounded-lg" /></div>}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>キャンセル</button>
              <button onClick={handleUpdate} disabled={saving} className="flex-1 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50" style={{ background: "var(--amber)", color: "#fff" }}>{saving ? "保存中…" : "更新"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Content from Book */}
      {showAddContent && selected && (
        <ContentModal
          books={books} genres={genres} allContents={allContents || contents}
          presetBook={{ bookId: selected.bookId, bookTitle: selected.title, genre: selected.genre, author: selected.author }}
          onClose={() => setShowAddContent(false)}
          onSave={async (data) => {
            if (onAddContent) {
              await onAddContent(data);
            } else {
              await fetch("/api/notion/contents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
              });
            }
          }}
        />
      )}

      {/* Content Detail */}
      {detailContent && onUpdateContent && onArchiveContent && (
        <DetailModal
          content={detailContent} books={books} allContents={allContents || contents}
          onClose={() => setDetailContent(null)}
          onEdit={() => { setEditingContent(detailContent); setDetailContent(null); }}
          onArchive={() => { onArchiveContent(detailContent.id, !detailContent.archived); setDetailContent(null); }}
          onBookClick={(b) => { setDetailContent(null); setSelected(b); setOpenChapters({}); }}
        />
      )}

      {/* Edit Content */}
      {editingContent && onUpdateContent && (
        <ContentModal
          books={books} genres={genres} allContents={allContents || contents} editing={editingContent}
          onClose={() => setEditingContent(null)} onSave={async () => {}}
          onUpdate={async (pageId, data) => { await onUpdateContent(pageId, data); setEditingContent(null); }}
        />
      )}
    </div>
  );
}
