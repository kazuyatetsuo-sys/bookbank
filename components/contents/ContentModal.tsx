"use client";
import { useState, useEffect } from "react";
import { Book, Content } from "@/hooks/useBookBank";

interface Props {
  books: Book[];
  genres: string[];
  allContents: Content[];
  editing?: Content | null;
  onClose: () => void;
  onSave: (data: Omit<Content, "id" | "title" | "archived" | "createdAt" | "updatedAt">) => Promise<boolean | void>;
  onUpdate?: (pageId: string, data: Partial<Content>) => Promise<void>;
}

const emptyForm = {
  contents: "", memo: "", bookId: "", bookTitle: "",
  chapter: 0, headline: 0, order: 0, genre: "", author: "", tags: [] as string[], relIds: "",
};

const inp = "w-full rounded-xl p-3 text-sm border focus:outline-none";
const inpStyle = { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" };

export default function ContentModal({ books, genres, allContents, editing, onClose, onSave, onUpdate }: Props) {
  const [form, setForm] = useState({ ...emptyForm });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [relSearch, setRelSearch] = useState("");

  // 全タグ一覧を収集
  const allTags = [...new Set(allContents.flatMap(c => c.tags))].sort();

  // サジェスト: tagInputに一致する既存タグ（未選択のもの）
  const tagSuggestions = tagInput.trim()
    ? allTags.filter(t => t.includes(tagInput.trim()) && !form.tags.includes(t))
    : [];

  useEffect(() => {
    if (editing) {
      setForm({
        contents: editing.contents, memo: editing.memo, bookId: editing.bookId,
        bookTitle: editing.bookTitle, chapter: editing.chapter, headline: editing.headline, order: editing.order ?? 0,
        genre: editing.genre, author: editing.author, tags: editing.tags, relIds: editing.relIds,
      });
    } else {
      setForm({ ...emptyForm });
    }
  }, [editing]);

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

  const relIdList = form.relIds ? form.relIds.split(",").filter(Boolean) : [];
  const relCandidates = allContents
    .filter((c) => !c.archived && c.id !== editing?.id)
    .filter((c) => relSearch ? c.title.includes(relSearch) || c.contents.includes(relSearch) : true)
    .slice(0, 20);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing && onUpdate) await onUpdate(editing.id, form);
      else await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="relative w-full sm:max-w-2xl border rounded-2xl overflow-y-auto max-h-[90vh] p-6 space-y-5"
        style={{ background: "var(--bg2)", borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>{editing ? "編集" : "新規コンテンツ"}</h2>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Contents</label>
          <textarea className={`${inp} resize-none h-32`} style={inpStyle} placeholder="本文を入力…"
            value={form.contents} onChange={(e) => setForm((f) => ({ ...f, contents: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>メモ</label>
          <textarea className={`${inp} resize-none h-60`} style={inpStyle} placeholder="メモを入力…"
            value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} />
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

        {/* Tags */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>タグ</label>
          <div className="flex gap-2">
            <input className={`flex-1 ${inp}`} style={inpStyle} placeholder="タグを入力…"
              value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
            <button onClick={() => addTag()} className="px-4 rounded-xl text-sm border"
              style={{ background: "var(--amber-bg)", borderColor: "var(--amber-border)", color: "var(--amber)" }}>追加</button>
          </div>
          {/* サジェスト */}
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
          {/* 選択済みタグ */}
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

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm border"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>キャンセル</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
            style={{ background: "var(--amber)", color: "#fff" }}>
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
