# 技術設計

## 採用構成
- クライアント: Phaser 3 + TypeScript
- 開発サーバー・ビルド: Vite
- 認証・永続化: Supabase Auth + PostgreSQL
- 初期リアルタイム通信: Supabase Realtime
- ホスティング: Vercel
- ソース管理: GitHub

## ディレクトリ方針
```text
src/
  main.ts
  style.css
  app/                 # アプリ起動・画面遷移
  game/
    scenes/            # Phaserシーン
    entities/          # プレイヤー・NPC・モンスター
    systems/           # 戦闘・移動・採取など
    data/              # 地域・アイテム等の定義
  features/
    auth/
    character/
    inventory/
    quests/
    chat/
    market/
    guild/
    housing/
  lib/
    supabase.ts
  types/
docs/
supabase/
  migrations/
```

## 重要な設計原則
1. 描画・入力とゲームルールを分離する。
2. アイテム・モンスター・スキル・地域はデータ定義から追加できるようにする。
3. クライアントから送られた所持金・経験値・ドロップ結果をそのまま信用しない。
4. 経済・アイテム付与・経験値など重要処理はDB制約や信頼できるサーバー処理で検証する。
5. Supabaseの全テーブルに適切なRLSを設定する。
6. service_role keyなどの秘密情報をブラウザーへ公開しない。
7. 通信が切れても画面が壊れないよう、接続状態と再接続処理を分離する。

## マルチプレイの段階
- 初期: 認証、プロフィール、セーブ、チャット。
- 次: 共有マップでのプレイヤー位置同期。
- その後: サーバー権威型の戦闘・敵AI・経済処理を検討。
- Supabase Realtimeだけを本格的な高頻度ゲームシミュレーションサーバーとして扱わない。必要になった段階で専用ゲームサーバーを導入する。

## 環境変数
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

公開可能な anon key でも、必ずRLSと適切な権限設計を併用する。
