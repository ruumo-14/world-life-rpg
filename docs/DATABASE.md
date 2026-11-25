# データベース設計（初期案）

実際のSQLマイグレーションは、各機能の実装前に制約・RLS・インデックスを確認して作成する。

## 主なテーブル
- profiles: auth.usersに対応する公開プロフィール
- characters: キャラクター基本情報、レベル、経験値、地域、座標
- character_stats: キャラクターの基礎ステータス
- inventory_stacks: アイテムIDごとの所持数
- equipment: 装備中アイテムと部位
- skills: スキル定義
- character_skills: 習得・強化済みスキル
- quests: クエスト定義
- character_quests: 受注・進行・達成状態
- worlds / regions: ワールド・地域定義
- player_presence: 一時的なオンライン状態（永続データと分離）
- chat_messages: チャット履歴
- guilds / guild_members: ギルドとメンバー
- market_listings: 出品情報
- land_plots: 個人土地と公開設定
- crops: 作物の状態

## データ設計ルール
- ユーザーIDはSupabase AuthのUUIDを参照する。
- アイテム数はアイテム種類ごとのスタックで保持し、所持枠数に依存させない。
- 通貨・経験値・アイテムの増減は、競合や不正を防ぐトランザクション処理を基本とする。
- チャットには長さ制限・送信頻度制限を設ける。
- プレイヤーが他人のプロフィールや土地を勝手に更新できないようRLSを設定する。
- presenceのような短命データは必要に応じてRealtime Presence等で扱い、DBに無制限に蓄積しない。
