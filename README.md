# ガントチャート管理アプリ

プロジェクトスケジュール管理のためのガントチャートアプリケーションです。

## 機能

- タスクの追加・編集・削除
- ガントバーの表示と色分け
- 初校・校了日の入力と表示
- 月またぎ対応の日付表示
- ローカルストレージを使用したデータ永続化
- Excelファイルのインポート・エクスポート

## 技術スタック

- React.js
- Vite
- TailwindCSS
- date-fns (日付操作)
- xlsx (Excel連携)
- lucide-react (アイコン)

## 開始方法

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# ビルドしたアプリのプレビュー
npm run preview
```

## データ構造

```json
[
  {
    "id": "task-1",
    "name": "企画書作成",
    "startDate": "2025-07-01",
    "endDate": "2025-07-05",
    "firstProofDate": "2025-07-03",
    "finalProofDate": "2025-07-05",
    "color": "#FF5733"
  }
]
```