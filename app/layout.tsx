import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Book Bank",
  description: "本から得た知識をNotionに蓄積する",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
