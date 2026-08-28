"use client";
import { useState, useEffect, useRef } from "react";
import { Book, Content } from "@/hooks/useBookBank";

export type PanelMode = "view" | "edit";

interface Props {
  content: Content | null;
  mode: PanelMode;
  books: Book[];
  genres: string[];
  allContents: Content[];
  onModeChange: (mode: PanelMode) => void;
  onUpdate: (pageId: string, data: Partial<Content>) => Promise<void>;
  onAdd?: (data: Omit<Content, "id" | "title" | "archived" | "createdAt" | "updatedAt">) => Promise<boolean | void>;
  onArchive: (pageId: string, archived: boolean) => Promise<void>;
  onBookClick?: (book: Book) => void;
  /** true (default): fills the parent's height and scrolls internally (desktop split view). false: flows with the page's own scroll (mobile full-screen). */
  fullHeight?: boolean;
}

const emptyForm = {
  contents: "", detail: "", memo: "", bookId: "", bookTitle: "",
  chapter: 0, headline: 0, order: 0, genre: "", author: "", tags: [] as string[], relIds: "", imageUrl: "",
};

const inp = "w-full rounded-xl p-3 text-sm border focus:outline-none";
const inpStyle = { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" };
const p = (n: number) => String(n).padStart(2, "0");

export default function ContentPanel({ content, mode, books, genres, allContents, onModeChange, onUpdate, onAdd, onArchive, onBookClick, fullHeight = true }: Props) {
  const [stack, setStack] = useState<Content[]>(content ? [content] : []);
  const [form, setForm] = useState({ ...emptyForm });
  const [tagInput, setTagInput] = useState("");
  const [relSearch, setRelSearch] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [imageConverting, setImageConverting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [forcedNew, setForcedNew] = useState(false);
  const handleSaveRef = useRef<(andContinue?: boolean) => Promise<void>>(async () => {});
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    setStack(content ? [content] : []);
  }, [content?.id]);

  const cur = stack[stack.length - 1] ?? null;

  useEffect(() => {
    if (cur) {
      setForm({
        contents: cur.contents, detail: cur.detail ?? "", memo: cur.memo, bookId: cur.bookId,
        bookTitle: cur.bookTitle, chapter: cur.chapter, headline: cur.headline, order: cur.order ?? 0,
        genre: cur.genre, author: cur.author, tags: cur.tags, relIds: cur.relIds,
        imageUrl: cur.imageUrl ?? "",
      });
      setImageInput(cur.imageUrl ?? "");
    }
    setForcedNew(false);
    setSaveError(null);
  }, [cur?.id]);

  const isEditingExisting = !!cur && !forcedNew;

  const handleSave = async (andContinue = false) => {
    if (!cur) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (isEditingExisting) await onUpdate(cur.id, form);
      else await onAdd?.(form);
      if (andContinue) {
        setForcedNew(true);
        setTagInput("");
        setImageInput("");
        setForm(f => ({
          ...emptyForm,
          bookId: f.bookId,
          bookTitle: f.bookTitle,
          genre: f.genre,
          author: f.author,
          chapter: f.chapter,
          headline: f.headline,
          order: f.order + 1,
        }));
      } else {
        setForcedNew(false);
        onModeChange("view");
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };
  handleSaveRef.current = handleSave;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.metaKey || e.key !== "Enter") return;
      if (!cur) return;
      e.preventDefault();
      if (modeRef.current === "view") onModeChange("edit");
      else handleSaveRef.current(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cur, onModeChange]);

  const handleBookChange = (bookId: string) => {
    const book = books.find((b) => b.bookId === bookId);
    setForm((f) => ({ ...f, bookId, bookTitle: book?.title ?? "", genre: book?.genre ?? f.genre, author: book?.author ?? f.author }));
  };

  const addTag = (tag?: string) => {
    const t = (tag ?? tagInput).trim();
    if (t && !form.tags.includes(t)) setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  const toggleRel = (id: string) => {
    const ids = form.relIds ? form.relIds.split(",").filter(Boolean) : [];
    const next = ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];
    setForm((f) => ({ ...f, relIds: next.join(",") }));
  };

  const handleImageInput = async (val: string) => {
    setImageInput(val);
    const isGooglePhotos = val.includes("photos.google.com") || val.includes("photos.app.goo.gl");
    if (isGooglePhotos && val.trim()) {
      setImageConverting(true);
      try {
        const res = await fetch(`/api/google-photos?url=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        if (data.imageUrl) setForm(f => ({ ...f, imageUrl: data.imageUrl }));
      } finally {
        setImageConverting(false);
      }
    } else {
      setForm(f => ({ ...f, imageUrl: val }));
    }
  };

  if (!cur) {
    return (
      <div className={`${fullHeight ? "h-full" : ""} flex items-center justify-center p-8 text-center`}>
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>コンテンツを選択してください</p>
      </div>
    );
  }

  if (mode === "edit") {
    const allTags = [...new Set(allContents.flatMap(c => c.tags))].sort();
    const tagSuggestions = tagInput.trim() ? allTags.filter(t => t.includes(tagInput.trim()) && !form.tags.includes(t)) : [];
    const relIdList = form.relIds ? form.relIds.split(",").filter(Boolean) : [];
    const relCandidates = allContents
      .filter((c) => !c.archived && c.id !== cur.id)
      .filter((c) => relSearch ? c.title.includes(relSearch) || c.contents.includes(relSearch) : true)
      .slice(0, 20);

    return (
      <div className={`${fullHeight ? "h-full overflow-y-auto overscroll-contain" : ""} p-6 space-y-5`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{isEditingExisting ? "編集" : "新規コンテンツ"}</h2>
          <button onClick={() => { setForcedNew(false); onModeChange("view"); }} className="text-2xl leading-none" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Contents</label>
          <textarea className={`${inp} resize-none h-32`} style={inpStyle} placeholder="本文を入力…"
            value={form.contents} onChange={(e) => setForm((f) => ({ ...f, contents: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Detail</label>
          <textarea className={`${inp} resize-none h-24`} style={inpStyle} placeholder="補足情報を入力…"
            value={form.detail} onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>memo</label>
          <textarea className={`${inp} resize-none h-60`} style={inpStyle} placeholder="気づきを入力…"
            value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>画像URL（Google Photos URL を貼ると自動変換）</label>
          <input className={inp} style={inpStyle}
            placeholder="https://photos.google.com/... または画像URL"
            value={imageInput}
            onChange={(e) => handleImageInput(e.target.value)} />
          {imageConverting && <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>変換中...</p>}
          {form.imageUrl && !imageConverting && (
            <div className="mt-2">
              <img src={form.imageUrl} alt="preview" className="max-h-40 rounded-xl object-cover border"
                style={{ borderColor: "var(--border)" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-xs block" style={{ color: "var(--text-muted)" }}>書籍 / チャプター / ヘッドライン</label>
          <select className={inp} style={inpStyle} value={form.bookId} onChange={(e) => handleBookChange(e.target.value)}>
            <option value="">書籍を選択…</option>
            {books.map((b) => <option key={b.bookId} value={b.bookId}>{b.title}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Chapter</label>
              <input type="number" min={0} max={99} className={inp} style={inpStyle}
                value={form.chapter} onChange={(e) => setForm((f) => ({ ...f, chapter: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Headline</label>
              <input type="number" min={0} max={99} className={inp} style={inpStyle}
                value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Order</label>
              <input type="number" min={0} max={99} className={inp} style={inpStyle}
                value={String(form.order).padStart(2, "0")} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>ジャンル</label>
          <select className={inp} style={inpStyle} value={form.genre} onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}>
            <option value="">選択…</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>著者</label>
          <input className={inp} style={inpStyle} placeholder="著者名…"
            value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>タグ</label>
          <div className="flex gap-2">
            <input className={`flex-1 ${inp}`} style={inpStyle} placeholder="タグを入力…"
              value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
            <button onClick={() => addTag()} className="px-4 rounded-xl text-sm border"
              style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>追加</button>
          </div>
          {tagSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tagSuggestions.slice(0, 8).map(t => (
                <button key={t} onClick={() => addTag(t)}
                  className="px-2.5 py-1 rounded-full text-xs border transition hover:opacity-70"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  + {t}
                </button>
              ))}
            </div>
          )}
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border"
                  style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>
                  {t}
                  <button onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))} className="leading-none">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>関連アイテム</label>
          <input className={`${inp} mb-2`} style={inpStyle} placeholder="検索…"
            value={relSearch} onChange={(e) => setRelSearch(e.target.value)} />
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {relCandidates.map((c) => (
              <button key={c.id} onClick={() => toggleRel(c.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition border"
                style={relIdList.includes(c.id)
                  ? { background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }
                  : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                {c.contents.slice(0, 60)}
              </button>
            ))}
          </div>
          {relIdList.length > 0 && <p className="text-xs mt-1" style={{ color: "var(--amber)" }}>{relIdList.length}件選択中</p>}
        </div>

        {saveError && (
          <div className="px-3 py-2 rounded-xl text-sm border" style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.4)", color: "#f87171" }}>
            保存エラー: {saveError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => { setForcedNew(false); onModeChange("view"); }} className="flex-1 py-3 rounded-xl text-sm border"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>キャンセル</button>
          <button onClick={() => handleSave(true)} disabled={saving}
            className="flex-1 py-3 rounded-xl font-semibold text-sm border disabled:opacity-50"
            style={{ borderColor: "var(--amber-border)", color: "var(--amber)", background: "var(--amber-bg)" }}>
            {saving ? "保存中…" : "続けて追加"}
          </button>
          <button onClick={() => handleSave(false)} disabled={saving}
            className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: "var(--amber)", color: "#fff" }}>
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    );
  }

  // view mode
  const book = books.find(b => b.bookId === cur.bookId);
  const relItems = cur.relIds
    ? cur.relIds.split(",").filter(Boolean).map(id => allContents.find(c => c.id === id)).filter(Boolean) as Content[]
    : [];

  return (
    <div className={fullHeight ? "h-full overflow-y-auto overscroll-contain" : ""}>
      {stack.length > 1 && (
        <button onClick={() => setStack(s => s.slice(0, -1))}
          className="flex items-center gap-1 px-5 pt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          ← 戻る
        </button>
      )}

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => book && onBookClick?.(book)}
            disabled={!book || !onBookClick}
            className="flex items-center gap-1.5 flex-shrink-0 min-w-0 max-w-[45%]"
          >
            {book?.coverUrl && <img src={book.coverUrl} alt="" className="w-5 h-7 object-cover rounded flex-shrink-0" />}
            <span className="text-xs truncate" style={{ color: "var(--amber)" }}>{cur.bookTitle} · Ch.{p(cur.chapter)} · HL.{p(cur.headline)} · #{cur.order}</span>
          </button>

          {(cur.author || cur.genre || cur.tags.length > 0) && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {cur.author && <span className="px-2 py-0.5 rounded-full text-xs border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>✍ {cur.author}</span>}
              {cur.genre && <span className="px-2 py-0.5 rounded-full text-xs border" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>{cur.genre}</span>}
              {cur.tags.map(t => <span key={t} className="px-2 py-0.5 rounded-full text-xs border" style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>{t}</span>)}
            </div>
          )}

          <span className="text-xs flex-shrink-0 ml-auto" style={{ color: "var(--text-faint)" }}>
            {cur.createdAt ? new Date(cur.createdAt).toLocaleDateString("ja-JP") : "—"}
          </span>

          {stack.length === 1 && (
            <>
              <button onClick={() => onArchive(cur.id, !cur.archived)} className="text-xs flex-shrink-0"
                style={{ color: "var(--text-faint)" }}>
                {cur.archived ? "restore" : "archive"}
              </button>
              <button onClick={() => onModeChange("edit")} aria-label="編集" title="編集"
                className="flex-shrink-0 leading-none" style={{ color: "var(--amber)", fontSize: "1rem" }}>
                ✎
              </button>
            </>
          )}
        </div>

        <p className="text-base font-medium leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>{cur.contents}</p>

        {cur.imageUrl && (
          <img src={cur.imageUrl} alt="" className="w-full rounded-xl object-cover max-h-64 border"
            style={{ borderColor: "var(--border)" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}

        {cur.detail && (
          <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>Detail</p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text)" }}>{cur.detail}</p>
          </div>
        )}

        {cur.memo && (
          <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>memo</p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text)" }}>{cur.memo}</p>
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

      </div>
    </div>
  );
}
