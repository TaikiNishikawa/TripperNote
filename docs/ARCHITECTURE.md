# Architecture

> 根拠：添付「Pasted markdown.md」（開発引き継ぎ）。記載のない仕様は未確定。実装・実機確認の状態は引き継ぎ時点の報告であり、この文書作成時に再検証したものではない。

根拠節：プロジェクト基本情報／Git / GitHub／Storage Architecture／Video Storage／実装時に絶対守ること。

## 引き継ぎに記載された環境
MacBook Pro M2 / 8GB、VS Code、Xcode 26.6、Node v24.20.0、npm 11.19.0、Capacitor 8.5.1。バージョンは原本の記録で、今回動作確認・更新した値ではない。
プロジェクト：~/Documents/HokutoTripApp。
Private GitHub：TaikiNishikawa/TripperNote。
Bundle ID：com.taikino.hokutotrip。
iPhone実機へXcodeからデプロイ済みとの報告。

mainは実機確認済み安定版と報告。元の安定Baselineはv2.5.8-B.3.1、commit 13a2c03（Baseline: v2.5.8-B.3.1 stable）、同名tag。開発branchはfeature/design-refresh。現在のcheckoutやHEADは別途確認する。文書だけを根拠にbranchを切り替えない。

## Native保護
PlaceResolverPlugin.swift / TripperBridgeViewController.swiftは既にXcode追加済み、Target Membership = App。
Main.storyboardのBridge View Controller custom class = TripperBridgeViewController。
重複追加、custom class変更、不要なXcode設定変更をしない。今回の文書導入ではSwift、Storyboard、Xcode設定を一切変更しない。

## Storage
A.1のV25/V26二重localStorage保存で実機QuotaExceededError発生。A.2で修正。
- localStorage：小さい互換データ・設定中心。
- IndexedDB：Tripper Note Core（Trip、Schedule、ChoiceSlot、Timeline、Block、NotificationEvent等）。写真IndexedDBも保護。
- Native File Storage：将来のMedia Original等。

巨大V26 JSONをlocalStorageへ保存しない。既存V25、北杜旅行の12 Photosを保持。アプリ削除やストレージ初期化を安易に案内しない。
B.3.2では起動時にIndexedDB Coreを読み戻すよう修正。compact化時にslot.v21のactive / actualStartAt / actualEndAtが互換データから落ちた問題を維持修正する。

## Video Storage（後続実装方針）
Original：Native Application Support、元品質保持、自動削除なし。
Preview：1080p中心、H.264、max30fps、約4–6Mbps、cache。
Poster：JPEG、長辺1280、quality約0.90。
処理順：Original → Metadata → Poster → Timeline表示 → Preview。
1 Timeline Video Blockの使用区間は最大2分。Original全体は保持し、trimStart / trimEndで非破壊編集。

## 実装後の通常フロー（今回は実行しない）
Coding → ダウンロード可能なZIP → ユーザーがwww置換 → プロジェクトでnpx cap sync ios → Xcode Product / Clean Build Folder / Run → スクリーンショット → 1項目ずつ実機確認。

## 未記載
Web UIフレームワーク、DBのstore/key/index、migration詳細、バックアップ/復元手順は不明。SwiftUI、SwiftData、CloudKit等の採用を推測しない。
