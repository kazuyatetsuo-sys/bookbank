# Book Bank - Notion DB セットアップ

## 1. Books DB

| カラム名 | 型 | 備考 |
|---|---|---|
| Title | title | 書籍タイトル |
| Author | rich_text | 著者名 |
| Genre | select | ジャンル |
| BookId | rich_text | ユニークID（自動生成） |
| CoverUrl | url | 表紙画像URL（任意） |
| Archived | checkbox | アーカイブフラグ |
| CreatedAt | date | 登録日 |

## 2. Contents DB

| カラム名 | 型 | 備考 |
|---|---|---|
| Title | title | コンテンツタイトル（自動: 書籍名 Ch.XX HL.XX） |
| Contents | rich_text | 本文 |
| Memo | rich_text | メモ |
| BookId | rich_text | Books DBのBookIdを参照 |
| BookTitle | rich_text | 書籍タイトル（表示用） |
| Chapter | number | チャプター番号 |
| Headline | number | ヘッドライン番号 |
| Genre | select | ジャンル（書籍から引き継ぎ） |
| Author | rich_text | 著者（書籍から引き継ぎ） |
| Tags | multi_select | タグ |
| RelIds | rich_text | 関連アイテムID（カンマ区切り） |
| Archived | checkbox | アーカイブフラグ |
| AppId | rich_text | アプリ識別子 |
| CreatedAt | date | 作成日 |
| UpdatedAt | date | 更新日 |

## 3. Sorts DB（IdeaBankと同構造）

| カラム名 | 型 |
|---|---|
| Name | title |
| SortId | rich_text |
| Conds | rich_text（JSON） |
| Order | rich_text |

## 環境変数（.env.local）

```
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=https://bookbank.vercel.app/api/notion/callback
NEXT_PUBLIC_APP_URL=https://bookbank.vercel.app
SESSION_SECRET=
DEFAULT_BOOKS_DB_ID=（Books DBのID）
DEFAULT_CONTENTS_DB_ID=（Contents DBのID）
DEFAULT_SORTS_DB_ID=（Sorts DBのID）
```
