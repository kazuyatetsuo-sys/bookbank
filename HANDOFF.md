# Book Bank — Claude Code 引き継ぎメモ

## プロジェクト概要
- リポジトリ: https://github.com/kazuyatetsuo-sys/bookbank
- ローカルパス: `~/Desktop/bookbank`
- デプロイ: https://bookbank-rho.vercel.app (`/dashboard`)
- スタック: Next.js 15.5.18 + Notion OAuth + iron-session, Vercel hosting
- 本から得た知識・ハイライトをNotion DBに蓄積する個人用アプリ

## Notion DBスキーマ
**Books DB**
- Title, Author, Genre (select), BookId, CoverUrl, Archived, CreatedAt
- Memo（テキスト）— 書籍メモ
- ChapterTitles（テキスト）— JSON配列 `[{num, title}, ...]` で目次タイトルを保存

**Contents DB**
- Contents, Memo, BookId, BookTitle, Chapter (number), Headline (number)
- Genre, Author, Tags (multi-select), RelIds (関連コンテンツのID, カンマ区切り)
- Archived, CreatedAt
- order（数値、**小文字**）— ヘッドライン内の手動並び順。0/未設定なら作成順（createdAt）にフォールバック

## 主要ファイル
- `app/dashboard/page.tsx` — メインダッシュボード（History/Books/Random/SortList/Sortタブ）
- `app/layout.tsx`, `app/globals.css` — テーマ（CSS変数によるライト/ダークモード、iOSズーム防止のため `font-size:16px !important` on input/textarea/select）
- `components/books/BookList.tsx` — 書籍一覧・ジャンルフィルター・書籍詳細（目次/HL区切り/コンテンツ詳細・編集・追加を内包）
- `components/contents/ContentModal.tsx` — コンテンツ追加・編集モーダル（タグサジェスト、関連アイテム検索、Order入力欄あり）
- `components/contents/DetailModal.tsx` — コンテンツ詳細表示（関連アイテムのスタックナビ、書籍名タップでBooksタブ遷移用の`onBookClick` props）
- `components/contents/SettingsPage.tsx` — ジャンル管理・アーカイブ・ログアウトボタン
- `hooks/useBookBank.ts` — Book/Content型定義 + CRUDフック
- `lib/notion.ts` — Notion APIラッパー
- `app/api/notion/{auth,callback,books,contents,sorts}/route.ts` — APIルート
- `app/api/auth/logout/route.ts` — ログアウト処理

## 開発ワークフロー（重要）
- ファイル編集は**全文書き直し**（heredoc / `cat > file << 'EOF'`）を基本とする。sedでの部分置換は重複・崩壊を繰り返したため非推奨。
- コミット〜push: `git add -A && git commit -m "..." && git push origin main`
- Vercel envは一度全部空になる事故があった。`npx vercel env pull --environment=production .env.production` で疑わしい時は確認すること。

## 今回のセッションでの主な変更履歴
1. Notion環境変数がVercel上で全部空文字だった重大バグを修正（CLIで再設定）
2. iPad/iPhoneでOAuthが失敗する問題 → `redirect_uri`にフォールバック値を追加
3. ログアウトボタン実装（`/api/auth/logout`）
4. 書籍にMemo・ChapterTitles（目次タイトル）フィールド追加、UI実装
5. 目次の並び替え（ドラッグ&ドロップ→iOS非対応のため▲▼ボタン方式に変更）
6. ContentModal/BookListのダークモード対応（ハードコードされた`text-white`等をCSS変数に置換）
7. モーダルをスマホでも中央表示に統一（bottom-sheet方式廃止）
8. ISBN取得: ISBN-10→13変換、Google Books優先 + Open Libraryフォールバック
9. 書籍一覧をジャンル別グループ化 → ジャンルチップでフィルタリング、未選択時はランダム表示
10. タグ入力にサジェスト機能（既存タグから一致候補を表示）
11. 書籍詳細から: コンテンツタップで詳細モーダル→編集可能、「+追加」でその書籍に紐づくコンテンツを追加
12. 書籍詳細の目次表示にHL（ヘッドライン）ごとの区切り線 + `#1,#2...`の連番表示
13. Contents DBに`order`（小文字）列を追加し、HL内の並び順を手動指定可能に（未設定はcreatedAt順）
14. ズーム機能廃止（viewport meta + input font-size 16px）
15. コンテンツ本文・メモの改行を表示に反映（`whitespace-pre-wrap`）
16. メモ入力欄の高さを3倍に拡大
17. コンテンツ詳細モーダルで書籍名をタップ→その書籍の詳細（目次）へ遷移できるように
18. Randomタブを改善: 真のランダム抽出 + 2件同時表示、「次へ/戻る」→「シャッフル」ボタンに変更

## 既知の課題・注意点
- BookList.tsxは過去に何度か部分編集が衝突し、stateや関数が重複/欠落するトラブルが頻発した。編集時は**ファイル全体を読んでから**全文書き直しを推奨。
- Google Books APIは無料利用枠でレート制限（429）にかかりやすい。APIキー未設定。
- History/Randomタブの`DetailModal`から書籍へ遷移する`onBookClick`は実装済みだが、historyDetail経由のみ。Random側は`historyDetail`を共有しているため動作する。

## 未着手・要望候補（このセッション終了時点で明示の依頼はなし）
- 特になし。直近の依頼はすべて対応済み。新規要望があれば本ファイルの「主な変更履歴」に追記していく運用を推奨。

## 直近の未完了タスク（要対応）
NotionのContents DBに `Detail`（テキスト）プロパティを追加済み。以下3点を実装してください。

1. **書籍詳細からコンテンツ追加時、書籍を自動選択**
   `components/books/BookList.tsx` の `showAddContent` 用 `ContentModal` 呼び出しで、開いている `selected`（書籍）の情報をフォームに事前セットする。`ContentModal` に `presetBook?: { bookId: string; bookTitle: string; genre?: string; author?: string }` のような props を追加し、`editing` がない新規作成時にこれをデフォルト値として使う案で良い。

2. **Detail欄の新設**（Notion側プロパティ `Detail` は追加済み）
   - `hooks/useBookBank.ts` の `Content` interface に `detail: string;` を追加
   - `lib/notion.ts` の `createContent`/`updateContent` に `Detail` プロパティの読み書きを追加
   - `app/api/notion/contents/route.ts` のGET/POST/PUTで `detail` のマッピングを追加（着手済みだったが未完了 — `contents` extractText/body部分に `detail` 追加のsedを実行中だった）
   - `components/contents/ContentModal.tsx`: Contents欄とメモ欄の間に「Detail」入力欄（textarea）を追加。Detailは「contentsを補足するための情報」、メモは「気づきを入力するためのスペース」という役割分担
   - `components/contents/DetailModal.tsx`: 表示側でもDetailをメモと別枠で表示

3. **「メモ」ラベルの表記変更**
   `ContentModal.tsx`・`DetailModal.tsx` 内のラベル表示「メモ」を「memo」（小文字英語）に変更。理由: Contents欄が既に英語表記のため、Detail/memoとの表記統一。
