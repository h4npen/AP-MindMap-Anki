# 📋 AP MindMap Anki 開発引き継ぎドキュメント

このドキュメントは、別プロジェクト・別AIへ開発を引き継ぐための構成・現状の問題・今後のアクションをまとめたものです。

---

## 1. プロジェクト概要

- **アプリ名**: `AP MindMap Anki`
- **目的**: 応用情報技術者試験の学習用アプリ。間違えた問題のスクショをアップロードすると、Gemini APIが自動で文字起こし＆極上解説を生成し、暗記カードとマインドマップ形式で脳内ハッキング学習ができる。
- **データ保存先**: Googleスプレッドシート（GAS Webアプリ経由で読み書き）

---

## 2. システム構成（最新設計）

ブラウザ（iPad）から直接GASを呼び出すと**CORS制限**で通信ブロックが発生するため、**Vercelを仲介人（プロキシ）**とするサーバー間通信の設計に移行しています。

```
[ 📱 iPad (ブラウザ) ]
       │  ▲ (CORSを回避した同ドメイン内通信)
       ▼  │  接続先: `/api/gas`
[ 🌐 Vercel 仲介サーバー (Node.js API) ]   ★ api/gas.js
       │  ▲ (CORS制限の対象外となる「サーバー間通信」)
       ▼  │  ※認証トークン `apAnki-S3cr3t-2026` をここで自動付与
[ 📄 GAS (スプレッドシートの管理人) ]
       │
       ▼
[ 📊 Googleスプレッドシート / Gemini API ]
```

---

## 3. 現在のファイル状況

1. **`api/gas.js` [NEW]**:
   - Vercel側で動作する「仲介サーバープログラム」。
   - iPadからのリクエストを受け取り、リダイレクト（`redirect: 'follow'`）を追従しつつ、環境変数から読み取ったトークンを自動で付与してGASに安全に転送する。
2. **`src/App.tsx` [MODIFIED]**:
   - 通信先（`GAS_API_URL`）を `/api/gas` に変更し、秘密トークンをブラウザ側に露出させないセキュアな設計に最適化済み。

---

## 4. 最新の接続情報

- **最新GAS WebアプリURL (「全員」アクセス設定済み)**:
  `https://script.google.com/macros/s/AKfycbzeqYEr5HNCioWpyyFsa-gARMzqiQKhw16_jY234ijmCPPv9vNf6S4I-EOp3rz-HO3lFw/exec`
- **セキュア認証トークン**:
  `apAnki-S3cr3t-2026`

---

## 5. 引き継ぎ後の具体的な手順 (To-Do)

新しいプロジェクトで引き継いだ後、以下の**3つの手順**を実行すれば完全に動作します。

### Step 1: `.env.local` のGAS URLを最新化する
ローカル環境の `.env.local` の値を最新のURLに書き換えて保存してください。
```env
VITE_GAS_URL=https://script.google.com/macros/s/AKfycbzeqYEr5HNCioWpyyFsa-gARMzqiQKhw16_jY234ijmCPPv9vNf6S4I-EOp3rz-HO3lFw/exec
VITE_GAS_TOKEN=apAnki-S3cr3t-2026
```

### Step 2: Vercelに最新の環境変数を登録する
ターミナルまたはVercelダッシュボードから、古い環境変数を削除し、新しい最新のURLを再登録します。
```bash
# 古い設定を削除
vercel env rm VITE_GAS_URL

# 最新URLを登録
vercel env add VITE_GAS_URL
# 値を聞かれるので、上記の「最新GAS WebアプリURL」を貼り付けます。
# 環境の選択（Production, Preview, Development）は「a」キーを押してすべてチェックを入れて進めます。
```

### Step 3: Vercelへ本番デプロイする
以下のコマンドを実行し、登録した環境変数を反映させた本番ビルドをデプロイします。
```bash
vercel --prod
```
デプロイ完了後に発行されるURL（例: `https://ap-mind-map-anki.vercel.app`）にiPadからアクセスすれば、CORSエラーなく完全に動作します。
