# World Life RPG

広大な共有世界を冒険し、自分の土地で生活し、友達と一緒に成長するオンラインRPG。

## 開発方針
- 2Dトップダウン視点。図形を中心にした軽量なグラフィック
- Phaser + TypeScript + Vite
- Supabase: 認証・データ保存・初期段階のリアルタイム同期
- Vercel: Web公開
- 全体設計を先に整え、基盤から段階的に実装する

## 必要環境
- Node.js 20.19+ または 22.12+
- npm

## 開発開始
```bash
npm install
npm run dev
```

## 環境変数
Supabaseを接続するときは `.env.local` を作成し、次を設定する。

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

秘密鍵や service_role key をブラウザー側の環境変数に設定しないこと。

## ドキュメント
- [ゲーム設計](docs/GAME_DESIGN.md)
- [技術設計](docs/TECHNICAL_DESIGN.md)
- [データベース設計](docs/DATABASE.md)
- [開発ロードマップ](docs/ROADMAP.md)
