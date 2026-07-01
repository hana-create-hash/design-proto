# この子の寄り道

「今日は、この子に誘われて寄り道する。」を試すためのWebプロトタイプです。

## 今の構成

- 通知が来た想定の部屋
- 犬の今日のわがまま
- くんくんサイン
- 軽く終わる画面

## 開き方

このフォルダの `index.html` をダブルクリックします。

URLで開く場合は、PowerShellでこのフォルダを開いて次を貼ります。

```powershell
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m http.server 5500 --bind 127.0.0.1
```

そのあと、ブラウザで開きます。

```text
http://127.0.0.1:5500/
```

## メモ

- 地図、SNS、入力中心のアプリ、育成ゲームではありません。
- 振動は、対応しているスマホでアプリを開いているときだけ動きます。
- 本物の「閉じていても届く1日1回通知」は、次の段階でPWA化やスマホアプリ化が必要です。
