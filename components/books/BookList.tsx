"use client";
import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Book, Content } from "@/hooks/useBookBank";
import ContentModal from "@/components/contents/ContentModal";
import ContentPanel, { PanelMode } from "@/components/contents/ContentPanel";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
type HeadlineEntry = { ch: number; hl: number; title: string };

function parseChapterTitles(raw: string): ChapterEntry[] {
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {}
  return [];
}
function stringifyChapterTitles(e: ChapterEntry[]): string {
  return JSON.stringify(e.filter(x => x.num || x.title));
}
function parseHeadlineTitles(raw: string): HeadlineEntry[] {
  try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } catch {}
  return [];
}
function stringifyHeadlineTitles(e: HeadlineEntry[]): string {
  return JSON.stringify(e.filter(x => x.title));
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
      <button onClick={() => {
          const last = chapters[chapters.length - 1];
          const nextNum = last ? String(Number(last.num) + 1) : "1";
          onChange([...chapters, { num: nextNum, title: "" }]);
        }}
        className="mt-2 text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>+ Chapterを追加</button>
    </div>
  );
}

function HeadlineList({ headlines, onChange }: { headlines: HeadlineEntry[]; onChange: (h: HeadlineEntry[]) => void }) {
  const move = (i: number, dir: number) => {
    const next = [...headlines]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; onChange(next);
  };
  return (
    <div>
      <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>HL目次</p>
      <div className="space-y-2">
        {headlines.map((hl, i) => (
          <div key={i} className="flex gap-2 items-center rounded-lg px-2 py-1 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-xs leading-none px-1 disabled:opacity-30" style={{ color: "var(--text-faint)" }}>▲</button>
              <button onClick={() => move(i, 1)} disabled={i === headlines.length - 1} className="text-xs leading-none px-1 disabled:opacity-30" style={{ color: "var(--text-faint)" }}>▼</button>
            </div>
            <input type="number" min={1} max={99} className="w-12 rounded-lg p-2 text-sm border text-center focus:outline-none" style={inpStyle}
              value={hl.ch} onChange={e => onChange(headlines.map((x, j) => j === i ? { ...x, ch: Number(e.target.value) } : x))} placeholder="Ch" />
            <input type="number" min={1} max={99} className="w-12 rounded-lg p-2 text-sm border text-center focus:outline-none" style={inpStyle}
              value={hl.hl} onChange={e => onChange(headlines.map((x, j) => j === i ? { ...x, hl: Number(e.target.value) } : x))} placeholder="HL" />
            <input className="flex-1 rounded-lg p-2 text-sm border focus:outline-none" style={inpStyle}
              value={hl.title} onChange={e => onChange(headlines.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="ヘッドラインタイトル" />
            <button onClick={() => onChange(headlines.filter((_, j) => j !== i))} className="text-sm px-2" style={{ color: "var(--text-faint)" }}>×</button>
          </div>
        ))}
      </div>
      <button onClick={() => {
          const last = headlines[headlines.length - 1];
          const nextCh = last ? last.ch : 1;
          const nextHl = last ? last.hl + 1 : 1;
          onChange([...headlines, { ch: nextCh, hl: nextHl, title: "" }]);
        }}
        className="mt-2 text-sm px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>+ HLを追加</button>
    </div>
  );
}

function BookContentTree({
  book, contents, openChapters, setOpenChapters, openHeadlines, setOpenHeadlines, onSelectContent, selectedContentId, enableKeyboardNav, onBack,
}: {
  book: Book;
  contents: Content[];
  openChapters: Record<number, boolean>;
  setOpenChapters: Dispatch<SetStateAction<Record<number, boolean>>>;
  openHeadlines: Record<string, boolean>;
  setOpenHeadlines: Dispatch<SetStateAction<Record<string, boolean>>>;
  onSelectContent: (c: Content) => void;
  selectedContentId?: string;
  enableKeyboardNav?: boolean;
  onBack?: () => void;
}) {
  const bc = contents.filter(c => !c.archived && c.bookId === book.bookId)
    .sort((a, b) => a.chapter - b.chapter || a.headline - b.headline || (a.order != null && b.order != null ? a.order - b.order : a.order != null ? -1 : b.order != null ? 1 : new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()));
  const chs = [...new Set(bc.map(c => c.chapter))].sort((a, b) => a - b);
  const chapterTitleMap: Record<string, string> = {};
  parseChapterTitles(book.chapterTitles || "").forEach(e => { chapterTitleMap[e.num] = e.title; });
  const headlineTitleMap: Record<string, string> = {};
  parseHeadlineTitles(book.headlineTitles || "").forEach(e => { headlineTitleMap[`${e.ch}-${e.hl}`] = e.title; });

  // Chapterを閉じる際は配下のHLも合わせて閉じる
  const closeChapterHeadlines = (ch: number) => {
    setOpenHeadlines(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (k.startsWith(`${ch}-`)) delete next[k]; });
      return next;
    });
  };
  const toggleChapter = (ch: number) => {
    const willOpen = !openChapters[ch];
    if (!willOpen) closeChapterHeadlines(ch);
    setOpenChapters(prev => ({ ...prev, [ch]: willOpen }));
  };

  const [focusedRowKey, setFocusedRowKey] = useState<string | null>(selectedContentId ? `c:${selectedContentId}` : null);
  useEffect(() => {
    if (selectedContentId) setFocusedRowKey(`c:${selectedContentId}`);
  }, [selectedContentId]);

  // 現在開いている行だけを対象にした、上から下へのフラットな行リスト（Chapter見出し→開いていればHL見出し→開いていればコンテンツ）
  type Row = { type: "chapter"; ch: number } | { type: "hl"; ch: number; hl: number } | { type: "content"; content: Content };
  const rows: Row[] = [];
  for (const ch of chs) {
    rows.push({ type: "chapter", ch });
    if (openChapters[ch]) {
      const chContents = bc.filter(c => c.chapter === ch);
      const hlNums = [...new Set(chContents.map(c => c.headline))].sort((a, b) => a - b);
      for (const hl of hlNums) {
        rows.push({ type: "hl", ch, hl });
        if (openHeadlines[`${ch}-${hl}`]) {
          for (const c of chContents.filter(c => c.headline === hl)) rows.push({ type: "content", content: c });
        }
      }
    }
  }
  const rowKey = (r: Row) => r.type === "chapter" ? `ch:${r.ch}` : r.type === "hl" ? `hl:${r.ch}-${r.hl}` : `c:${r.content.id}`;
  const scrollRowIntoView = (key: string) => {
    requestAnimationFrame(() => {
      document.querySelector(`[data-row-key="${CSS.escape(key)}"]`)?.scrollIntoView({ block: "nearest" });
    });
  };

  useEffect(() => {
    if (!enableKeyboardNav) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      if (!rows.length) return;
      const curIdx = focusedRowKey ? rows.findIndex(r => rowKey(r) === focusedRowKey) : -1;
      e.preventDefault();

      // ↑↓: 現在表示中の行の間を1つずつ移動するだけ（折りたたまれた中へは踏み込まない）。選択の確定は→キーのみ
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const nextIdx = curIdx < 0 ? 0 : e.key === "ArrowDown" ? Math.min(curIdx + 1, rows.length - 1) : Math.max(curIdx - 1, 0);
        const next = rows[nextIdx];
        setFocusedRowKey(rowKey(next));
        scrollRowIntoView(rowKey(next));
        return;
      }

      // ←→: 折りたたみ/展開の専用操作。コンテンツの選択はまたがない
      const row = curIdx >= 0 ? rows[curIdx] : rows[0];
      if (curIdx < 0) { setFocusedRowKey(rowKey(row)); scrollRowIntoView(rowKey(row)); return; }

      if (e.key === "ArrowRight") {
        if (row.type === "chapter") {
          if (!openChapters[row.ch]) setOpenChapters(prev => ({ ...prev, [row.ch]: true }));
          else {
            const child = rows[curIdx + 1];
            if (child?.type === "hl" && child.ch === row.ch) { setFocusedRowKey(rowKey(child)); scrollRowIntoView(rowKey(child)); }
          }
        } else if (row.type === "hl") {
          const hlKey = `${row.ch}-${row.hl}`;
          if (!openHeadlines[hlKey]) setOpenHeadlines(prev => ({ ...prev, [hlKey]: true }));
          else {
            const child = rows[curIdx + 1];
            if (child?.type === "content" && child.content.chapter === row.ch && child.content.headline === row.hl) {
              setFocusedRowKey(rowKey(child));
              scrollRowIntoView(rowKey(child));
            }
          }
        } else if (row.type === "content") {
          onSelectContent(row.content);
        }
      } else if (e.key === "ArrowLeft") {
        if (row.type === "hl") {
          const hlKey = `${row.ch}-${row.hl}`;
          if (openHeadlines[hlKey]) setOpenHeadlines(prev => ({ ...prev, [hlKey]: false }));
          else {
            const parent = rows.find(r => r.type === "chapter" && r.ch === row.ch);
            if (parent) { setFocusedRowKey(rowKey(parent)); scrollRowIntoView(rowKey(parent)); }
          }
        } else if (row.type === "chapter") {
          if (openChapters[row.ch]) toggleChapter(row.ch);
          else onBack?.();
        } else if (row.type === "content") {
          const parentKey = `hl:${row.content.chapter}-${row.content.headline}`;
          if (rows.some(r => rowKey(r) === parentKey)) { setFocusedRowKey(parentKey); scrollRowIntoView(parentKey); }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enableKeyboardNav, rows, focusedRowKey, openChapters, openHeadlines, onSelectContent, setOpenChapters, setOpenHeadlines, onBack]);

  if (!bc.length) return <p className="text-sm text-center py-8" style={{ color: "var(--text-faint)" }}>コンテンツがありません</p>;
  const rowAccent = (active: boolean) => ({
    borderLeft: active ? "3px solid var(--amber)" : "3px solid transparent",
    borderBottom: "1px solid var(--border)",
  });
  return (
    <div>
      <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>目次</p>
      {chs.map(ch => {
        const chContents = bc.filter(c => c.chapter === ch);
        const isOpen = openChapters[ch];
        const chTitle = chapterTitleMap[String(ch)] || "";
        const hlNums = [...new Set(chContents.map(c => c.headline))].sort((a, b) => a - b);
        return (
          <div key={ch}>
            <button data-row-key={`ch:${ch}`}
              onClick={() => { setFocusedRowKey(`ch:${ch}`); toggleChapter(ch); }}
              className="w-full flex items-center gap-2 text-left pl-3 pr-1 py-3 transition hover:opacity-70"
              style={rowAccent(focusedRowKey === `ch:${ch}`)}>
              <span className="text-xs flex-shrink-0 w-3" style={{ color: "var(--text-faint)" }}>{isOpen ? "▼" : "▶"}</span>
              <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: "var(--amber)" }}>Ch.{p(ch)}</span>
              <span className="text-sm truncate" style={{ color: "var(--text)" }}>{chTitle || `Chapter ${p(ch)}`}</span>
              <span className="text-xs flex-shrink-0 ml-auto" style={{ color: "var(--text-faint)" }}>{chContents.length}件</span>
            </button>
            {isOpen && (
              <div className="pl-4">
                {hlNums.map(hl => {
                  const hlKey = `${ch}-${hl}`;
                  const hlContents = chContents.filter(c => c.headline === hl);
                  const isHlOpen = openHeadlines[hlKey] ?? false;
                  const hlTitle = headlineTitleMap[hlKey] || "";
                  return (
                    <div key={hl}>
                      <button
                        data-row-key={`hl:${hlKey}`}
                        onClick={() => { setFocusedRowKey(`hl:${hlKey}`); setOpenHeadlines(prev => ({ ...prev, [hlKey]: !prev[hlKey] })); }}
                        className="w-full flex items-center gap-2 text-left pl-3 pr-1 py-2.5 transition hover:opacity-70"
                        style={rowAccent(focusedRowKey === `hl:${hlKey}`)}>
                        <span className="text-xs flex-shrink-0 w-3" style={{ color: "var(--text-faint)" }}>{isHlOpen ? "▼" : "▶"}</span>
                        <span className="text-xs font-mono flex-shrink-0" style={{ color: "var(--amber)" }}>HL.{p(hl)}</span>
                        {hlTitle && <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{hlTitle}</span>}
                        <div className="flex-1" />
                        <span className="text-xs flex-shrink-0" style={{ color: "var(--text-faint)" }}>{hlContents.length}件</span>
                      </button>
                      {isHlOpen && (
                        <div className="pl-4">
                          {hlContents.map((c) => (
                            <button key={c.id} data-row-key={`c:${c.id}`}
                              onClick={() => { setFocusedRowKey(`c:${c.id}`); onSelectContent(c); }}
                              className="w-full text-left pl-3 pr-1 py-3 transition hover:opacity-70"
                              style={rowAccent(focusedRowKey === `c:${c.id}`)}>
                              <div className="flex items-start gap-2">
                                <span className="text-xs flex-shrink-0 mt-0.5 font-mono" style={{ color: "var(--text-faint)" }}>#{c.order}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{c.contents}</p>
                                  {c.detail && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{c.detail}</p>}
                                  {c.imageUrl && (
                                    <img src={c.imageUrl} alt="" className="mt-2 max-h-32 rounded-lg object-cover border"
                                      style={{ borderColor: "var(--border)" }}
                                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                  )}
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
                      )}
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
}

export default function BookList({ books, genres, contents = [], allContents, onAdd, onUpdate, onDelete, onUpdateContent, onArchiveContent, onAddContent, selectedBook, onSelectBook }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [chapters, setChapters] = useState<ChapterEntry[]>([]);
  const [headlines, setHeadlines] = useState<HeadlineEntry[]>([]);
  const [editing, setEditing] = useState<Book | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editChapters, setEditChapters] = useState<ChapterEntry[]>([]);
  const [editHeadlines, setEditHeadlines] = useState<HeadlineEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [internalSelected, setInternalSelected] = useState<Book | null>(null);
  const rawSelected = selectedBook !== undefined ? selectedBook : internalSelected;
  const selected = rawSelected ? (books.find(b => b.id === rawSelected.id) ?? rawSelected) : null;
  const setSelected = onSelectBook || setInternalSelected;
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({});
  const [openHeadlines, setOpenHeadlines] = useState<Record<string, boolean>>({});
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [focusedBookIndex, setFocusedBookIndex] = useState<number>(-1);
  const [showAddContent, setShowAddContent] = useState(false);
  const [panelContent, setPanelContent] = useState<Content | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("view");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlInitialized = useRef(false);

  const lookup = async (isbn: string, isEdit = false) => {
    setIsbnLoading(true);
    const r = await fetchIsbn(isbn);
    if (isEdit) setEditForm(f => ({ ...f, ...r })); else setForm(f => ({ ...f, ...r }));
    setIsbnLoading(false);
  };
  const handleAdd = async () => {
    if (!form.title.trim()) return; setSaving(true);
    await onAdd({ title: form.title, author: form.author, genre: form.genre, coverUrl: form.coverUrl, memo: form.memo, chapterTitles: stringifyChapterTitles(chapters), headlineTitles: stringifyHeadlineTitles(headlines) });
    setForm({ ...emptyForm }); setChapters([]); setHeadlines([]); setShowAdd(false); setSaving(false);
  };
  const handleUpdate = async () => {
    if (!editing) return;
    setSaving(true);
    setBookError(null);
    const headlineTitlesJson = stringifyHeadlineTitles(editHeadlines);
    try {
      await onUpdate(editing.id, { title: editForm.title, author: editForm.author, genre: editForm.genre, coverUrl: editForm.coverUrl, memo: editForm.memo, chapterTitles: stringifyChapterTitles(editChapters), headlineTitles: headlineTitlesJson });
      setEditing(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setBookError(msg);
    } finally {
      setSaving(false);
    }
  };
  const startEdit = (b: Book) => {
    setEditing(b);
    setEditForm({ title: b.title, author: b.author, genre: b.genre, coverUrl: b.coverUrl, isbn: "", memo: b.memo || "" });
    setEditChapters(parseChapterTitles(b.chapterTitles || ""));
    setEditHeadlines(parseHeadlineTitles(b.headlineTitles || ""));
  };

  const allGenres = [...new Set(books.map(b => b.genre || "未分類"))].sort();

  const latestContentDate = (bookId: string) =>
    contents
      .filter(c => !c.archived && c.bookId === bookId)
      .reduce((max, c) => Math.max(max, new Date(c.createdAt || 0).getTime()), 0);

  const displayBooks = selectedGenre
    ? books.filter(b => (b.genre || "未分類") === selectedGenre)
    : [...books].sort((a, b) => {
        const dateA = latestContentDate(a.bookId) || new Date(a.createdAt || 0).getTime();
        const dateB = latestContentDate(b.bookId) || new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

  const selectBookAndReset = (b: Book) => { setSelected(b); setOpenChapters({}); setOpenHeadlines({}); };

  const pickRandomFromBook = (b: Book) => {
    const bookContents = contents.filter(c => !c.archived && c.bookId === b.bookId);
    if (!bookContents.length) return;
    const pick = bookContents[Math.floor(Math.random() * bookContents.length)];
    setPanelContent(pick);
    setPanelMode("view");
  };

  // 本を閉じたら(書籍一覧に戻ったら)Chapter/HLの開閉状態を全てリセット
  useEffect(() => {
    if (!selected) { setOpenChapters({}); setOpenHeadlines({}); }
  }, [selected]);

  // 書籍一覧での↑↓キー選択・Enter/→キーで決定
  useEffect(() => {
    if (selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Enter" && e.key !== "ArrowRight") return;
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      if (!displayBooks.length) return;

      if (e.key === "Enter" || e.key === "ArrowRight") {
        const b = focusedBookIndex >= 0 ? displayBooks[focusedBookIndex] : undefined;
        if (!b) return;
        e.preventDefault();
        selectBookAndReset(b);
        return;
      }

      e.preventDefault();
      setFocusedBookIndex(prev => {
        const next = e.key === "ArrowDown" ? Math.min(prev + 1, displayBooks.length - 1) : Math.max(prev - 1, 0);
        const b = displayBooks[next];
        requestAnimationFrame(() => {
          document.querySelector(`[data-row-key="book:${CSS.escape(b.id)}"]`)?.scrollIntoView({ block: "nearest" });
        });
        return next;
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, displayBooks, focusedBookIndex]);

  // URLの book/content パラメータから初期表示を復元(直接アクセス・共有用)
  useEffect(() => {
    if (urlInitialized.current) return;
    const bookIdParam = searchParams.get("book");
    const contentIdParam = searchParams.get("content");
    if (!bookIdParam && !contentIdParam) { urlInitialized.current = true; return; }
    if (!books.length || !contents.length) return;
    urlInitialized.current = true;
    const c = contentIdParam ? contents.find(x => x.id === contentIdParam) : undefined;
    if (c) {
      const b = books.find(x => x.bookId === c.bookId);
      if (b) selectBookAndReset(b);
      setOpenChapters(prev => ({ ...prev, [c.chapter]: true }));
      setOpenHeadlines(prev => ({ ...prev, [`${c.chapter}-${c.headline}`]: true }));
      setPanelContent(c);
      setPanelMode("view");
      return;
    }
    const b = bookIdParam ? books.find(x => x.bookId === bookIdParam) : undefined;
    if (b) selectBookAndReset(b);
  }, [books, contents, searchParams]);

  // 選択中の書籍・コンテンツをURLに反映(直接アクセス・共有用)
  useEffect(() => {
    if (!urlInitialized.current) return;
    const params = new URLSearchParams();
    if (selected) params.set("book", selected.bookId);
    if (panelContent) params.set("content", panelContent.id);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [selected?.bookId, panelContent?.id, router, pathname]);

  const bookListScreen = (
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
      <div>
        {!selectedGenre && <p className="text-xs mb-2" style={{ color: "var(--text-faint)" }}>新しい順</p>}
        {displayBooks.map((b, i) => (
          <div key={b.id} data-row-key={`book:${b.id}`}
            onClick={() => { setFocusedBookIndex(i); selectBookAndReset(b); }}
            className="flex gap-3 items-center pl-3 pr-1 py-3 cursor-pointer transition hover:opacity-70"
            style={{
              borderLeft: focusedBookIndex === i ? "3px solid var(--amber)" : "3px solid transparent",
              borderBottom: "1px solid var(--border)",
            }}>
            {b.coverUrl
              ? <img src={b.coverUrl} alt="" className="w-10 h-14 object-cover rounded-lg flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              : <div className="w-10 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-lg" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>📖</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{b.title}</p>
              {b.author && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{b.author}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={e => { e.stopPropagation(); pickRandomFromBook(b); }} className="text-xs" aria-label="ランダム表示" title="ランダム表示" style={{ color: "var(--text-muted)" }}>🎲</button>
              <button onClick={e => { e.stopPropagation(); onDelete(b.id); }} className="text-xs hover:text-red-400" style={{ color: "var(--text-faint)" }}>削除</button>
            </div>
          </div>
        ))}
        {books.length === 0 && <p className="text-center py-12 text-sm" style={{ color: "var(--text-faint)" }}>書籍が登録されていません</p>}
      </div>
    </div>
  );

  const renderTreeScreen = (book: Book) => (
    <div>
      <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm mb-3" style={{ color: "var(--text-muted)" }}>
        ← 書籍一覧
      </button>
      <div className="flex items-start gap-3 mb-4">
        {book.coverUrl
          ? <img src={book.coverUrl} alt="" className="w-14 h-20 object-cover rounded-xl flex-shrink-0" />
          : <div className="w-14 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>📖</div>
        }
        <div className="flex-1">
          <h2 className="font-semibold text-base leading-tight" style={{ color: "var(--text)" }}>{book.title}</h2>
          {book.author && <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{book.author}</p>}
          {book.genre && <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs border" style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>{book.genre}</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => pickRandomFromBook(book)} className="px-2.5 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} aria-label="ランダム表示" title="ランダム表示">🎲</button>
          <button onClick={() => startEdit(book)} className="px-2.5 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} aria-label="編集" title="編集">✎</button>
          <button onClick={() => setShowAddContent(true)} className="px-3 py-1.5 rounded-lg text-xs border"
            style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>+ 追加</button>
        </div>
      </div>
      {book.memo && (
        <div className="mb-4 p-3 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>📝 メモ</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{book.memo}</p>
        </div>
      )}
      <BookContentTree book={book} contents={contents}
        openChapters={openChapters} setOpenChapters={setOpenChapters}
        openHeadlines={openHeadlines} setOpenHeadlines={setOpenHeadlines}
        onSelectContent={(c) => { setPanelContent(c); setPanelMode("view"); }}
        selectedContentId={panelContent?.id} enableKeyboardNav
        onBack={() => setSelected(null)} />
    </div>
  );

  const contentPanel = (fullHeight: boolean) => (
    <ContentPanel
      fullHeight={fullHeight}
      content={panelContent}
      mode={panelMode}
      books={books}
      genres={genres}
      allContents={allContents || contents}
      onModeChange={setPanelMode}
      onUpdate={async (pageId, data) => {
        await onUpdateContent?.(pageId, data);
        setPanelContent(prev => prev && prev.id === pageId ? { ...prev, ...data } as Content : prev);
      }}
      onAdd={onAddContent}
      onArchive={async (pageId, archived) => {
        await onArchiveContent?.(pageId, archived);
        setPanelContent(prev => prev && prev.id === pageId ? { ...prev, archived } : prev);
      }}
      onBookClick={(b) => { selectBookAndReset(b); setPanelContent(null); }}
    />
  );

  return (
    <div className="space-y-4">
      {isDesktop ? (
        <div className="flex" style={{ height: "75vh" }}>
          <div className="w-1/2 min-w-0 overflow-y-auto overscroll-contain border-r py-4 pr-4" style={{ borderColor: "var(--border)" }}>
            {!selected ? bookListScreen : renderTreeScreen(selected)}
          </div>
          <div className="w-1/2 min-w-0 pl-4">
            {contentPanel(true)}
          </div>
        </div>
      ) : panelContent ? (
        <div>
          <button onClick={() => setPanelContent(null)} className="flex items-center gap-1 text-sm mb-3" style={{ color: "var(--text-muted)" }}>
            ← 戻る
          </button>
          {contentPanel(false)}
        </div>
      ) : selected ? (
        renderTreeScreen(selected)
      ) : (
        bookListScreen
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
            <HeadlineList headlines={headlines} onChange={setHeadlines} />
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
            <HeadlineList headlines={editHeadlines} onChange={setEditHeadlines} />
            {editForm.coverUrl && <div className="flex justify-center"><img src={editForm.coverUrl} alt="" className="h-20 object-cover rounded-lg" /></div>}
            {bookError && (
              <div className="px-3 py-2 rounded-xl text-sm border" style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.4)", color: "#f87171" }}>
                保存エラー: {bookError}
              </div>
            )}
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
    </div>
  );
}
