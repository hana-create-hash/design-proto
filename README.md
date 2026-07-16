# WagaMee

小悪魔のわがままを口実に、自分のための寄り道へ出るWebアプリのプロトタイプです。

## ローカルで開く方法

PowerShellでこのフォルダを開いて、次を実行します。

```powershell
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd" dev
```

ブラウザで次を開きます。

```text
http://127.0.0.1:5511/
```

## Vercelで公開する方法

1. このリポジトリをGitHubにPushします。
2. Vercelで「Add New Project」を選びます。
3. GitHubの `design-proto` リポジトリを選びます。
4. Framework Preset が `Next.js` になっていることを確認します。
5. そのままDeployします。

## Firebase通知を使う方法

Firebase Cloud Messagingを使うには、Vercelに次の環境変数を追加します。

```text
NEXT_PUBLIC_FIREBASE_VAPID_KEY
```

VAPID keyは、Firebase Consoleの Cloud Messaging で作成する「Web Push証明書キー」です。
このキーを入れたあと、Vercelで再デプロイしてください。

## 入っているもの

- Next.js版のWagaMee本体
- PWA用の `manifest.webmanifest`
- Firebase通知に対応した `sw.js`
- スマホの向きと振動を使った小悪魔サイン

スマホ本体の振動は、対応しているAndroidブラウザなどで動きます。iPhone SafariではWebページから本体バイブレーションを鳴らせない場合があります。
