"use client";
import { useState } from "react";
import { Book, Content } from "@/hooks/useBookBank";

interface Props {
  books: Book[];
  genres: string[];
  contents?: Content[];
  onAdd: (data: Omit<Book, "id" | "bookId" | "createdAt">) => Promise<void>;
  onUpdate: (pageId: string, data: Partial<Book>) => Promise<void>;
  onDelete: (pageId: string) => Promise<void>;
}

const emptyForm = { title: "", author: "", genre: "", coverUrl: "" };

export default function BookList({ books, genres, onAdd, onUpdate, onDelete }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState<Book | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onAdd({ title: form.title, author: form.author, genre: form.genre, coverUrl: form.coverUrl });
    setForm({ ...emptyForm });
    setShowAdd(false);
    setSaving(false);
  };

  const startEdit = (b: Book) => {
    setEditing(b);
    setEditForm({ title: b.title, author: b.author, genre: b.genre, coverUrl: b.coverUrl });
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setSaving(true);
    await onUpdate(editing.id, editForm);
    setEditing(null);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-white/30">{books.length}冊</p>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-xl text-sm hover:bg-amber-400/30 transition"
        >
          + 書籍を追加
        </button>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {books.map((b) => (
          <div
            key={b.id}
            className="bg-white/3 border border-white/8 rounded-2xl p-4 flex gap-4 items-start"
          >
            {/* Cover placeholder */}
            <div className="w-12 h-16 bg-gradient-to-br from-amber-400/20 to-amber-600/10 rounded-lg flex-shrink-0 flex items-center justify-center text-amber-400/40 text-xs">
              📖
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{b.title}</p>
              {b.author && <p className="text-white/50 text-xs mt-0.5">{b.author}</p>}
              {b.genre && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-white/5 border border-white/10 text-white/40 rounded-full text-xs">{b.genre}</span>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => startEdit(b)}
                className="text-white/30 hover:text-white text-xs transition"
              >編集</button>
              <button
                onClick={() => onDelete(b.id)}
                className="text-white/20 hover:text-red-400 text-xs transition"
              >削除</button>
            </div>
          </div>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center py-16 text-white/20 text-sm">書籍が登録されていません</div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full sm:max-w-md bg-[#0f1117] border border-white/10 rounded-t-3xl sm:rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold">書籍を追加</h3>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
              placeholder="タイトル *"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
              placeholder="著者"
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            />
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
            >
              <option value="">ジャンルを選択…</option>
              {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition">キャンセル</button>
              <button onClick={handleAdd} disabled={saving || !form.title.trim()} className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-semibold text-sm hover:bg-amber-300 transition disabled:opacity-50">
                {saving ? "保存中…" : "追加"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="w-full sm:max-w-md bg-[#0f1117] border border-white/10 rounded-t-3xl sm:rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold">書籍を編集</h3>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
              placeholder="タイトル *"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
              placeholder="著者"
              value={editForm.author}
              onChange={(e) => setEditForm((f) => ({ ...f, author: e.target.value }))}
            />
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-400/50"
              value={editForm.genre}
              onChange={(e) => setEditForm((f) => ({ ...f, genre: e.target.value }))}
            >
              <option value="">ジャンルを選択…</option>
              {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition">キャンセル</button>
              <button onClick={handleUpdate} disabled={saving} className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-semibold text-sm hover:bg-amber-300 transition disabled:opacity-50">
                {saving ? "保存中…" : "更新"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
