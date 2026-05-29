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
  contents: "",
  memo: "",
  bookId: "",
  bookTitle: "",
  chapter: 0,
  headline: 0,
  genre: "",
  author: "",
  tags: [] as string[],
  relIds: "",
};

export default function ContentModal({ books, genres, allContents, editing, onClose, onSave, onUpdate }: Props) {
  const [form, setForm] = useState({ ...emptyForm });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [relSearch, setRelSearch] = useState("");

  useEffect(() => {
    if (editing) {
      setForm({
        contents: editing.contents,
        memo: editing.memo,
        bookId: editing.bookId,
        bookTitle: editing.bookTitle,
        chapter: editing.chapter,
        headline: editing.headline,
        genre: editing.genre,
        author: editing.author,
        tags: editing.tags,
        relIds: editing.relIds,
      });
    } else {
      setForm({ ...emptyForm });
    }
  }, [editing]);

  const selectedBook = books.find((b) => b.bookId === form.bookId);

  const handleBookChange = (bookId: string) => {
    const book = books.find((b) => b.bookId === bookId);
    setForm((f) => ({
      ...f,
      bookId,
      bookTitle: book?.title ?? "",
      genre: book?.genre ?? f.genre,
      author: book?.author ?? f.author,
    }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
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
      if (editing && onUpdate) {
        await onUpdate(editing.id, form);
      } else {
        await onSave(form);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center " onClick={onClose}>
      <div
        className="relative w-full sm:max-w-2xl  border border-white/10 rounded-t-3xl sm:rounded-2xl overflow-y-auto max-h-[90vh] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{editing ? "編集" : "新規コンテンツ"}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
        </div>

        {/* Contents */}
        <div>
          <label className="text-xs text-white/50 mb-1 block">Contents</label>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm resize-none focus:outline-none focus:border-amber-400/50 h-32"
            placeholder="本文を入力…"
            value={form.contents}
            onChange={(e) => setForm((f) => ({ ...f, contents: e.target.value }))}
          />
        </div>

        {/* Memo */}
        <div>
          <label className="text-xs text-white/50 mb-1 block">メモ</label>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm resize-none focus:outline-none focus:border-amber-400/50 h-20"
            placeholder="メモを入力…"
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
          />
        </div>

        {/* Book / Chapter / Headline */}
        <div className="space-y-3">
          <label className="text-xs text-white/50 block">書籍 / チャプター / ヘッドライン</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
            value={form.bookId}
            onChange={(e) => handleBookChange(e.target.value)}
          >
            <option value="">書籍を選択…</option>
            {books.map((b) => (
              <option key={b.bookId} value={b.bookId}>{b.title}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Chapter</label>
              <input
                type="number"
                min={0}
                max={99}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
                value={form.chapter}
                onChange={(e) => setForm((f) => ({ ...f, chapter: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Headline</label>
              <input
                type="number"
                min={0}
                max={99}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        {/* Genre */}
        <div>
          <label className="text-xs text-white/50 mb-1 block">ジャンル</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
            value={form.genre}
            onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
          >
            <option value="">選択…</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Author */}
        <div>
          <label className="text-xs text-white/50 mb-1 block">著者</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
            placeholder="著者名…"
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-xs text-white/50 mb-1 block">タグ</label>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
              placeholder="タグを追加…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <button onClick={addTag} className="px-4 bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-xl text-sm hover:bg-amber-400/30 transition">追加</button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-3 py-1 bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-full text-xs">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-white leading-none">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Related Items */}
        <div>
          <label className="text-xs text-white/50 mb-1 block">関連アイテム</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50 mb-2"
            placeholder="検索…"
            value={relSearch}
            onChange={(e) => setRelSearch(e.target.value)}
          />
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {relCandidates.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleRel(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${relIdList.includes(c.id) ? "bg-amber-400/20 text-amber-400 border border-amber-400/30" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
              >
                {c.title}
              </button>
            ))}
          </div>
          {relIdList.length > 0 && (
            <p className="text-xs text-amber-400/70 mt-1">{relIdList.length}件選択中</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition text-sm">
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-semibold hover:bg-amber-300 transition text-sm disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
