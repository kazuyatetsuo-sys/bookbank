"use client";
import { useState, useEffect, useCallback } from "react";

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  bookId: string;
  coverUrl: string;
  createdAt: string;
}

export interface Content {
  id: string;
  title: string;
  contents: string;
  memo: string;
  bookId: string;
  bookTitle: string;
  chapter: number;
  headline: number;
  genre: string;
  author: string;
  tags: string[];
  relIds: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sort {
  id: string;
  name: string;
  sortId: string;
  conds: string;
  order: string;
}

export function useBookBank() {
  const [books, setBooks] = useState<Book[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [sorts, setSorts] = useState<Sort[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- fetch ----
  const fetchBooks = useCallback(async () => {
    const res = await fetch("/api/notion/books");
    if (!res.ok) return;
    const data = await res.json();
    setBooks(data.books ?? []);
  }, []);

  const fetchContents = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const q = new URLSearchParams(params ?? {}).toString();
      const res = await fetch(`/api/notion/contents${q ? `?${q}` : ""}`);
      if (!res.ok) return;
      const data = await res.json();
      setContents(data.contents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSorts = useCallback(async () => {
    const res = await fetch("/api/notion/sorts");
    if (!res.ok) return;
    const data = await res.json();
    setSorts(data.sorts ?? []);
  }, []);

  useEffect(() => {
    fetchBooks();
    fetchContents();
    fetchSorts();
  }, [fetchBooks, fetchContents, fetchSorts]);

  // ---- books ----
  const addBook = async (data: Omit<Book, "id" | "bookId" | "createdAt">) => {
    const res = await fetch("/api/notion/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) await fetchBooks();
  };

  const updateBook = async (pageId: string, data: Partial<Book>) => {
    await fetch("/api/notion/books", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, ...data }),
    });
    await fetchBooks();
  };

  const deleteBook = async (pageId: string) => {
    await fetch("/api/notion/books", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, archive: true }),
    });
    await fetchBooks();
  };

  // ---- contents ----
  const addContent = async (data: Omit<Content, "id" | "title" | "archived" | "createdAt" | "updatedAt">) => {
    const res = await fetch("/api/notion/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) await fetchContents();
    return res.ok;
  };

  const updateContent = async (pageId: string, data: Partial<Content>) => {
    await fetch("/api/notion/contents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, ...data }),
    });
    await fetchContents();
  };

  const archiveContent = async (pageId: string, archived: boolean) => {
    await fetch("/api/notion/contents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, archive: archived }),
    });
    await fetchContents();
  };

  // ---- sorts ----
  const addSort = async (data: { name: string; conds: Record<string, unknown> }) => {
    await fetch("/api/notion/sorts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await fetchSorts();
  };

  const deleteSort = async (pageId: string) => {
    await fetch("/api/notion/sorts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, delete: true }),
    });
    await fetchSorts();
  };

  // ---- genres (derived from books) ----
  const genres = Array.from(new Set(books.map((b) => b.genre).filter(Boolean)));

  // ---- history (last 20 by createdAt) ----
  const history = [...contents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  return {
    books,
    contents,
    sorts,
    history,
    genres,
    loading,
    error,
    fetchBooks,
    fetchContents,
    fetchSorts,
    addBook,
    updateBook,
    deleteBook,
    addContent,
    updateContent,
    archiveContent,
    addSort,
    deleteSort,
    setError,
  };
}
