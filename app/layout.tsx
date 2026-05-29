import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Bank",
  description: "本から得た知識をNotionに蓄積する",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
