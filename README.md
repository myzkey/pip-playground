# pip-playground

Document Picture-in-Picture API の学習用リポジトリ。

## 概要

Chrome の `documentPictureInPicture.requestWindow()` を使って、独立したPiPウィンドウにReact UIを描画するデモ。iframe との比較も可能。

## セットアップ

```bash
pnpm install
pnpm dev
```

## コマンド

| コマンド | 説明 |
|----------|------|
| `pnpm dev` | 開発サーバー起動 (http://localhost:5173) |
| `pnpm build` | プロダクションビルド |
| `pnpm lint` | ESLint実行 |

## 機能

### Document PiP
- Open PiP ボタンでPiPウィンドウを開く
- PiP内にReactコンポーネントをマウント
- カウンター操作（PiP内で独立動作）
- 親ウィンドウ / PiP内からClose可能

### iframe（比較用）
- 同様のUIをiframeで実装
- postMessageによる親子間通信

## Document PiP vs iframe

| 項目 | Document PiP | iframe |
|------|--------------|--------|
| ウィンドウ | 独立したOSウィンドウ | 親ページ内に埋め込み |
| 最前面表示 | 他アプリの上に常に表示 | タブ切替で見えなくなる |
| オリジン | 親と同一（直接アクセス可） | 分離可能（postMessage通信） |
| ブラウザ対応 | Chrome 116+ | 全ブラウザ |

## ファイル構成

```
packages/pip-demo/src/
├── main.tsx
├── App.tsx              # 統合UI（PiP + iframe）
├── pip/
│   ├── pip-root.tsx     # PiPウィンドウ内のReactコンポーネント
│   ├── mount-to-pip.ts  # requestWindow & createRoot
│   └── pip-styles.ts    # PiP用CSS
└── iframe/
    ├── iframe-root.tsx
    ├── mount-to-iframe.ts
    └── iframe-styles.ts
```

## 技術仕様

### PiP生成フロー

1. Feature detection: `"documentPictureInPicture" in window`
2. `documentPictureInPicture.requestWindow({ width, height })`
3. PiPウィンドウの `document.body` に `<div id="root">` を作成
4. `createRoot(rootEl).render(<PipRoot />)`
5. `pagehide` イベントで閉鎖検知 → クリーンアップ

### 状態管理

```typescript
type Status = "idle" | "opened" | "closed" | "unsupported";
```

## 対応ブラウザ

- Chrome 116+（Document PiP）
- その他ブラウザはiframeのみ動作
