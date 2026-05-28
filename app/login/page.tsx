"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.authenticated) router.replace("/dashboard");
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div>
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Book Bank</h1>
          <p className="text-white/40 mt-2 text-sm">本から得た知識を、Notionに蓄積する</p>
        </div>
        <a
          href="/api/notion/auth"
          className="inline-flex items-center gap-3 px-8 py-4 bg-amber-400 text-black font-semibold rounded-2xl hover:bg-amber-300 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-400/20"
        >
          <span>Notionでログイン</span>
        </a>
        <p className="text-white/20 text-xs">Notion OAuth 2.0で安全に認証されます</p>
      </div>
    </div>
  );
}
