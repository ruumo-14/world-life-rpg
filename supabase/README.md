# Supabase 初期設定

1. Supabase Dashboardで対象プロジェクトを開く。
2. 左側の **SQL Editor** を開き、New queryを作成する。
3. GitHubの `supabase/migrations/0001_initial_schema.sql` を開き、内容をコピーしてSQL Editorへ貼り付ける。
4. Runを押し、エラーが出ずに完了したことを確認する。
5. Table Editorに `profiles`、`characters`、`inventory_stacks` などが作成されたことを確認する。

## 接続情報
Project Settings → API（または Connect）からProject URLと公開用 anon/publishable keyを確認する。
これらはVercelのEnvironment Variablesに設定する:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

ローカル開発では `.env.local` に同じ変数を設定する。`.env.local` はGitへコミットしない。

**重要:** `service_role` key、DB password、個人アクセストークンはブラウザーへ公開しない。チャットにも貼らない。

この初期マイグレーションはテーブルとRLSの基礎を作るもの。経験値・通貨・アイテム獲得などの重要なゲーム処理は、今後サーバー側RPC/Edge Function等へ移し、クライアントが数値を自由に書き換えられないようにする。
